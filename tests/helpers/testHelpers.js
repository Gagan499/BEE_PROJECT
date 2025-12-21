// Test helper functions
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

/**
 * Connect to in-memory MongoDB for testing
 */
export async function connectDB() {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
}

/**
 * Close database connection and stop in-memory server
 */
export async function closeDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

/**
 * Clear all collections in the database
 */
export async function clearDB() {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}

/**
 * Generate a valid future date
 */
export function getFutureDate(daysFromNow = 7) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

/**
 * Generate a valid past date
 */
export function getPastDate(daysAgo = 7) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
}

/**
 * Create a mock user object
 */
export function createMockUser(overrides = {}) {
  return {
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedPassword123',
    ...overrides,
  };
}

/**
 * Create a mock booking object
 */
export function createMockBooking(overrides = {}) {
  const arrivalDate = new Date();
  arrivalDate.setDate(arrivalDate.getDate() + 7);
  const departureDate = new Date(arrivalDate);
  departureDate.setDate(departureDate.getDate() + 3);

  return {
    name: 'John Doe',
    phoneNumber: '1234567890',
    email: 'john@example.com',
    bookingType: 'package',
    packageName: 'Test Package',
    arrivalDate,
    departureDate,
    adults: 2,
    children: 0,
    ...overrides,
  };
}



