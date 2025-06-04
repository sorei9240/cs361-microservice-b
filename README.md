# Microservice B: Review Management Service

This microservice handles flashcard grading and progress tracking for the ZiXue HSK Flashcards application using a spaced repetition algorithm.

## API Endpoints

### POST /grade
Grade a flashcard and update its review schedule.

**Request Body:**
```json
{
  "cardId": "string",
  "isCorrect": boolean
}
```

**Response:**
```json
{
  "success": true,
  "cardId": "string",
  "progress": {
    "cardId": "string",
    "streak": number,
    "lastReviewed": "ISO date string",
    "nextReviewDate": "ISO date string",
    "totalReviews": number,
    "correctReviews": number
  },
  "responseTime": "string"
}
```

### POST /reset
Reset a card's progress to initial state.

**Request Body:**
```json
{
  "cardId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "cardId": "string",
  "progress": {
    "cardId": "string",
    "streak": 0,
    "lastReviewed": "ISO date string",
    "nextReviewDate": "ISO date string",
    "totalReviews": 0,
    "correctReviews": 0
  },
  "message": "Card progress has been reset"
}
```

### GET /progress/:cardId
Get the current progress for a specific card.

### GET /due
Get all cards that are due for review.

### GET /health
Health check endpoint.

## Spaced Repetition Algorithm

The service implements a simplified spaced repetition algorithm:

- **Correct answers**: Increase review interval (1 day → 3 days → 7 days → 14 days → 30 days → exponential growth)
- **Incorrect answers**: Reset interval to 1 day
- **Streak tracking**: Maintains consecutive correct answers
- **Review scheduling**: Automatically calculates next review date

## Setup Instructions

1. **Create the microservice directory:**
   ```bash
   mkdir microservice-b
   cd microservice-b
   ```

2. **Create the files:**
   - Copy `server.js` (the main service code)
   - Copy `package.json` (dependencies)
   - Copy `test.js` (test script)

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the service:**
   ```bash
   npm start
   ```

5. **Test the service:**
   ```bash
   npm test
   ```

The service will run on `http://localhost:3001`

## Data Persistence

- Progress data is stored in `progress.json` file
- Data is automatically loaded on startup
- Data is saved after each update operation

## Quality Attributes

### Responsiveness
- All grading operations complete in under 1 second
- Response times are measured and included in API responses
- Optimized for fast card grading during study sessions

### Usability
- Clear API endpoints with descriptive names
- Comprehensive error messages
- Simple request/response format
- Health check endpoint for monitoring

## Communication

This microservice communicates via REST API. It runs as a separate process and can be called by the main application through HTTP requests.

## Example Usage

```javascript
// Grade a card as correct
const response = await fetch('http://localhost:3001/grade', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    cardId: 'hsk1_你好',
    isCorrect: true
  })
});

const result = await response.json();
console.log('New streak:', result.progress.streak);
```

## Monitoring

- Health check: `GET /health`
- View all progress: `GET /all-progress`
- Due cards: `GET /due`