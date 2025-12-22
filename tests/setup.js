// Global test setup
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.test' });

// Set test environment variables if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
process.env.mongo_uri = process.env.mongo_uri || 'mongodb://localhost:27017/test-bee-project';

// Suppress console logs during tests (optional - uncomment if needed)
// Note: jest.fn() is available in test files, not in setup files

