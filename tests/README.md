# Testing Documentation

This directory contains comprehensive tests for the BEE_PROJECT application, covering unit, integration, and functional testing for booking and login functionality.

## Test Structure

```
tests/
├── unit/                    # Unit tests for individual components
│   ├── booking.unit.test.js
│   └── login.unit.test.js
├── integration/             # Integration tests for API endpoints
│   ├── booking.integration.test.js
│   └── login.integration.test.js
├── functional/              # Functional tests for complete workflows
│   ├── booking.functional.test.js
│   └── login.functional.test.js
├── helpers/                 # Test helper functions
│   └── testHelpers.js
├── setup.js                 # Global test setup
└── README.md                # This file
```

## Test Types

### Unit Tests
- **Purpose**: Test individual functions and components in isolation
- **Location**: `tests/unit/`
- **Coverage**:
  - Booking model validation
  - JWT token generation and verification
  - Password hashing and comparison
  - Login validation logic
  - Redis login limit functions

### Integration Tests
- **Purpose**: Test how different components work together (API + Database)
- **Location**: `tests/integration/`
- **Coverage**:
  - Booking API endpoints with database operations
  - Login/Auth API endpoints with database and Redis
  - Authentication middleware
  - Status updates and queries

### Functional Tests
- **Purpose**: Test complete end-to-end user workflows
- **Location**: `tests/functional/`
- **Coverage**:
  - Complete booking creation and management flow
  - Complete registration and login flow
  - Multiple user sessions
  - Error handling scenarios
  - Status transitions

## Prerequisites

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   - Create a `.env.test` file (optional) for test-specific environment variables
   - Tests will use default values if environment variables are not set

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Functional tests only
npm run test:functional
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Generate Coverage Report
```bash
npm run test:coverage
```

## Test Configuration

- **Jest Configuration**: `jest.config.js`
- **Test Setup**: `tests/setup.js`
- **Test Environment**: Node.js with in-memory MongoDB (MongoDB Memory Server)

## Mocked Dependencies

The following dependencies are mocked in tests:

- **Socket.io**: WebSocket connections
- **Email Services**: Nodemailer and booking emails
- **Email Validation**: Verifalia API
- **Redis**: Redis client for login limits
- **Admin Auth**: Admin authentication middleware

## Test Database

Tests use **MongoDB Memory Server**, which creates an in-memory MongoDB instance. This means:
- No external database setup required
- Tests run in isolation
- Database is automatically cleaned between tests
- Fast test execution

## Writing New Tests

### Example Unit Test
```javascript
import { describe, it, expect } from '@jest/globals';

describe('My Feature', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Example Integration Test
```javascript
import request from 'supertest';
import express from 'express';

const app = express();
app.use('/api/my-route', myRouter);

describe('My API', () => {
  it('should handle POST request', async () => {
    const response = await request(app)
      .post('/api/my-route')
      .send({ data: 'test' })
      .expect(200);
    
    expect(response.body.success).toBe(true);
  });
});
```

## Troubleshooting

### Tests Fail with "JWT_SECRET not defined"
- Ensure `JWT_SECRET` is set in your environment or `.env.test` file
- Tests will use a default test secret if not provided

### MongoDB Connection Errors
- Tests use in-memory MongoDB, so no external MongoDB is needed
- If errors persist, try clearing `node_modules` and reinstalling

### Redis Mock Issues
- Redis is fully mocked in tests
- No actual Redis server is required

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage of business logic
- **Integration Tests**: All API endpoints covered
- **Functional Tests**: All major user flows covered

## Continuous Integration

These tests are designed to run in CI/CD pipelines:
- No external dependencies required
- Fast execution
- Isolated test environment
- Deterministic results

## Notes

- Tests are designed to be independent and can run in any order
- Each test cleans up after itself
- Mock data is used to avoid external API calls
- Test timeout is set to 30 seconds for slow operations




