const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for card progress 
let cardProgress = new Map();

// Load existing progress data on startup
const PROGRESS_FILE = path.join(__dirname, 'progress.json');

async function loadProgress() {
  try {
    const data = await fs.readFile(PROGRESS_FILE, 'utf8');
    const progressData = JSON.parse(data);
    cardProgress = new Map(Object.entries(progressData));
    console.log('Loaded existing progress data');
  } catch (error) {
    console.log('No existing progress file found, starting fresh');
  }
}

async function saveProgress() {
  try {
    const progressObj = Object.fromEntries(cardProgress);
    await fs.writeFile(PROGRESS_FILE, JSON.stringify(progressObj, null, 2));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

// Calculate next review date using spaced repetition algorithm
function calculateNextReviewDate(streak, isCorrect) {
  const now = new Date();
  let daysToAdd = 1;
  
  if (isCorrect) {
    // Increase interval based on streak (simplified spaced repetition)
    switch (streak) {
      case 0: daysToAdd = 1; break;
      case 1: daysToAdd = 3; break;
      case 2: daysToAdd = 7; break;
      case 3: daysToAdd = 14; break;
      case 4: daysToAdd = 30; break;
      default: daysToAdd = Math.min(365, 30 * Math.pow(1.5, streak - 4)); break;
    }
  } else {
    // Reset to 1 day for incorrect answers
    daysToAdd = 1;
  }
  
  const nextReview = new Date(now);
  nextReview.setDate(now.getDate() + daysToAdd);
  return nextReview.toISOString();
}

// Initialize card progress if it doesn't exist
function initializeCard(cardId) {
  if (!cardProgress.has(cardId)) {
    cardProgress.set(cardId, {
      cardId,
      streak: 0,
      lastReviewed: new Date().toISOString(),
      nextReviewDate: new Date().toISOString(),
      totalReviews: 0,
      correctReviews: 0
    });
  }
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'Review Management Service',
    timestamp: new Date().toISOString()
  });
});

// Grade a flashcard (User Story 1)
app.post('/grade', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { cardId, isCorrect } = req.body;
    
    if (!cardId || typeof isCorrect !== 'boolean') {
      return res.status(400).json({
        error: 'Missing required fields: cardId and isCorrect'
      });
    }
    
    initializeCard(cardId);
    const progress = cardProgress.get(cardId);
    
    // Update progress
    progress.totalReviews += 1;
    progress.lastReviewed = new Date().toISOString();
    
    if (isCorrect) {
      progress.streak += 1;
      progress.correctReviews += 1;
    } else {
      progress.streak = 0; // Reset streak on incorrect answer
    }
    
    // Calculate next review date
    progress.nextReviewDate = calculateNextReviewDate(progress.streak, isCorrect);
    
    // Save updated progress
    cardProgress.set(cardId, progress);
    saveProgress(); 
    
    const responseTime = Date.now() - startTime;
    
    res.json({
      success: true,
      cardId,
      progress,
      responseTime: `${responseTime}ms`
    });
    
  } catch (error) {
    console.error('Error grading card:', error);
    res.status(500).json({
      error: 'Internal server error while grading card'
    });
  }
});

// Reset a card's progress (User Story 2)
app.post('/reset', async (req, res) => {
  try {
    const { cardId } = req.body;
    
    if (!cardId) {
      return res.status(400).json({
        error: 'Missing required field: cardId'
      });
    }
    
    // Reset card progress
    const resetProgress = {
      cardId,
      streak: 0,
      lastReviewed: new Date().toISOString(),
      nextReviewDate: new Date().toISOString(), // Due today
      totalReviews: 0,
      correctReviews: 0
    };
    
    cardProgress.set(cardId, resetProgress);
    saveProgress(); // Async save
    
    res.json({
      success: true,
      cardId,
      progress: resetProgress,
      message: 'Card progress has been reset'
    });
    
  } catch (error) {
    console.error('Error resetting card:', error);
    res.status(500).json({
      error: 'Internal server error while resetting card'
    });
  }
});

// Get card progress
app.get('/progress/:cardId', (req, res) => {
  try {
    const { cardId } = req.params;
    
    initializeCard(cardId);
    const progress = cardProgress.get(cardId);
    
    res.json({
      success: true,
      progress
    });
    
  } catch (error) {
    console.error('Error getting progress:', error);
    res.status(500).json({
      error: 'Internal server error while getting progress'
    });
  }
});

// Get cards due for review 
app.get('/due', (req, res) => {
  try {
    const now = new Date();
    const dueCards = [];
    
    for (const [cardId, progress] of cardProgress) {
      const dueDate = new Date(progress.nextReviewDate);
      if (dueDate <= now) {
        dueCards.push({
          cardId,
          ...progress,
          overdueDays: Math.floor((now - dueDate) / (1000 * 60 * 60 * 24))
        });
      }
    }
    
    // Sort by due date (most overdue first)
    dueCards.sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate));
    
    res.json({
      success: true,
      dueCards,
      count: dueCards.length
    });
    
  } catch (error) {
    console.error('Error getting due cards:', error);
    res.status(500).json({
      error: 'Internal server error while getting due cards'
    });
  }
});

// Get due cards for a specific deck/level
app.get('/due/:deckId', (req, res) => {
  try {
    const { deckId } = req.params;
    const now = new Date();
    const dueCards = [];
    
    for (const [cardId, progress] of cardProgress) {
      // Check if card belongs to the requested deck
      if (cardId.startsWith(deckId + '_')) {
        const dueDate = new Date(progress.nextReviewDate);
        if (dueDate <= now) {
          dueCards.push({
            cardId,
            ...progress,
            overdueDays: Math.floor((now - dueDate) / (1000 * 60 * 60 * 24))
          });
        }
      }
    }
    
    // Sort by due date (most overdue first)
    dueCards.sort((a, b) => new Date(a.nextReviewDate) - new Date(b.nextReviewDate));
    
    res.json({
      success: true,
      deckId,
      dueCards,
      count: dueCards.length
    });
    
  } catch (error) {
    console.error('Error getting due cards for deck:', error);
    res.status(500).json({
      error: 'Internal server error while getting due cards for deck'
    });
  }
});

// Get all progress data
app.get('/all-progress', (req, res) => {
  try {
    const allProgress = Object.fromEntries(cardProgress);
    res.json({
      success: true,
      progress: allProgress,
      totalCards: cardProgress.size
    });
  } catch (error) {
    console.error('Error getting all progress:', error);
    res.status(500).json({
      error: 'Internal server error while getting all progress'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /grade',
      'POST /reset',
      'GET /progress/:cardId',
      'GET /due',
      'GET /due/:deckId',
      'GET /all-progress'
    ]
  });
});

// Start server
async function startServer() {
  await loadProgress();
  
  app.listen(PORT, () => {
    console.log(`Review Management Service running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Loaded ${cardProgress.size} card progress records`);
  });
}

startServer().catch(console.error);

module.exports = app;