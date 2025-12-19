/**
 * Integration Tests for Booking API
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import bookingsRouter from '../../src/routes/bookings.js';
import Booking from '../../models/booking.js';
import { connectDB, closeDB, clearDB, createMockBooking } from '../helpers/testHelpers.js';

// Mock dependencies
jest.mock('../../config/socket.js', () => ({
  getIO: jest.fn(() => ({
    emit: jest.fn(),
  })),
}));

jest.mock('../../src/routes/bookings_mail.js', () => ({
  DefaultEmail: jest.fn().mockResolvedValue(true),
  AcceptRequestEmail: jest.fn().mockResolvedValue(true),
  RejectRequestEmail: jest.fn().mockResolvedValue(true),
}));

jest.mock('../../src/routes/emailValidator.js', () => ({
  validateEmail: jest.fn().mockResolvedValue({
    isValid: true,
    result: {
      classification: 'Deliverable',
      isDisposableEmailAddress: false,
    },
  }),
}));

jest.mock('../../src/Middlewares/adminAuth.js', () => {
  return jest.fn((req, res, next) => {
    // Mock admin auth - allow all requests in tests
    req.user = { name: 'Admin', email: 'admin@test.com' };
    next();
  });
});

const app = express();
app.use(express.json());
app.use('/api/bookings', bookingsRouter);

describe('Booking API - Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  describe('POST /api/bookings - Create Booking', () => {
    it('should create a new booking with valid data', async () => {
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 7);
      const departureDate = new Date(arrivalDate);
      departureDate.setDate(departureDate.getDate() + 3);

      const bookingData = {
        customerName: 'John Doe',
        phoneNumber: '1234567890',
        emailId: 'john@example.com',
        bookingType: 'package',
        packageName: 'Test Package',
        arrivalDate: arrivalDate.toISOString(),
        departureDate: departureDate.toISOString(),
        adults: 2,
        children: 1,
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.bookingId).toBeDefined();

      // Verify booking was saved in database
      const savedBooking = await Booking.findById(response.body.bookingId);
      expect(savedBooking).toBeDefined();
      expect(savedBooking.name).toBe(bookingData.customerName);
      expect(savedBooking.email).toBe(bookingData.emailId);
      expect(savedBooking.bookingType).toBe(bookingData.bookingType);
    });

    it('should fail when required fields are missing', async () => {
      const bookingData = {
        customerName: 'John Doe',
        // Missing other required fields
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Missing required fields');
    });

    it('should fail when packageName is missing for package booking', async () => {
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 7);
      const departureDate = new Date(arrivalDate);
      departureDate.setDate(departureDate.getDate() + 3);

      const bookingData = {
        customerName: 'John Doe',
        phoneNumber: '1234567890',
        emailId: 'john@example.com',
        bookingType: 'package',
        // packageName missing
        arrivalDate: arrivalDate.toISOString(),
        departureDate: departureDate.toISOString(),
        adults: 2,
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('packageName is required');
    });

    it('should fail when hotelName is missing for stayOnly booking', async () => {
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 7);
      const departureDate = new Date(arrivalDate);
      departureDate.setDate(departureDate.getDate() + 3);

      const bookingData = {
        customerName: 'John Doe',
        phoneNumber: '1234567890',
        emailId: 'john@example.com',
        bookingType: 'stayOnly',
        // hotelName missing
        arrivalDate: arrivalDate.toISOString(),
        departureDate: departureDate.toISOString(),
        adults: 2,
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('hotelName is required');
    });

    it('should fail when arrival date is in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const bookingData = {
        customerName: 'John Doe',
        phoneNumber: '1234567890',
        emailId: 'john@example.com',
        bookingType: 'package',
        packageName: 'Test Package',
        arrivalDate: pastDate.toISOString(),
        departureDate: futureDate.toISOString(),
        adults: 2,
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Arrival date cannot be in the past');
    });

    it('should fail when departure date is before arrival date', async () => {
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 7);
      const departureDate = new Date(arrivalDate);
      departureDate.setDate(departureDate.getDate() - 1);

      const bookingData = {
        customerName: 'John Doe',
        phoneNumber: '1234567890',
        emailId: 'john@example.com',
        bookingType: 'package',
        packageName: 'Test Package',
        arrivalDate: arrivalDate.toISOString(),
        departureDate: departureDate.toISOString(),
        adults: 2,
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Departure date must be after arrival date');
    });

    it('should create stayOnly booking successfully', async () => {
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 7);
      const departureDate = new Date(arrivalDate);
      departureDate.setDate(departureDate.getDate() + 3);

      const bookingData = {
        customerName: 'Jane Doe',
        phoneNumber: '9876543210',
        emailId: 'jane@example.com',
        bookingType: 'stayOnly',
        hotelName: 'Test Hotel',
        arrivalDate: arrivalDate.toISOString(),
        departureDate: departureDate.toISOString(),
        adults: 1,
        children: 0,
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(response.body.success).toBe(true);
      
      const savedBooking = await Booking.findById(response.body.bookingId);
      expect(savedBooking.bookingType).toBe('stayOnly');
      expect(savedBooking.hotelName).toBe('Test Hotel');
    });
  });

  describe('GET /api/bookings - List Bookings', () => {
    it('should return all bookings', async () => {
      // Create test bookings
      const booking1 = createMockBooking({ name: 'User 1' });
      const booking2 = createMockBooking({ name: 'User 2' });
      await new Booking(booking1).save();
      await new Booking(booking2).save();

      const response = await request(app)
        .get('/api/bookings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.bookings).toHaveLength(2);
    });

    it('should return empty array when no bookings exist', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.bookings).toHaveLength(0);
    });
  });

  describe('GET /api/bookings/:id - Get Single Booking', () => {
    it('should return a booking by ID', async () => {
      const bookingData = createMockBooking();
      const booking = await new Booking(bookingData).save();

      const response = await request(app)
        .get(`/api/bookings/${booking._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.booking._id.toString()).toBe(booking._id.toString());
      expect(response.body.booking.name).toBe(bookingData.name);
    });

    it('should return 404 for non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .get(`/api/bookings/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });
  });

  describe('PATCH /api/bookings/:id/status - Update Booking Status', () => {
    it('should update booking status to approved', async () => {
      const bookingData = createMockBooking();
      const booking = await new Booking(bookingData).save();

      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/status`)
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('approved');

      // Verify in database
      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.status).toBe('approved');
    });

    it('should update booking status to rejected', async () => {
      const bookingData = createMockBooking();
      const booking = await new Booking(bookingData).save();

      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/status`)
        .send({ status: 'rejected' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('rejected');

      const updatedBooking = await Booking.findById(booking._id);
      expect(updatedBooking.status).toBe('rejected');
    });

    it('should fail with invalid status', async () => {
      const bookingData = createMockBooking();
      const booking = await new Booking(bookingData).save();

      const response = await request(app)
        .patch(`/api/bookings/${booking._id}/status`)
        .send({ status: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid status');
    });

    it('should return 404 for non-existent booking', async () => {
      const fakeId = new mongoose.Types.ObjectId();

      const response = await request(app)
        .patch(`/api/bookings/${fakeId}/status`)
        .send({ status: 'approved' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});

