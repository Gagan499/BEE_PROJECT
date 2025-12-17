/**
 * Functional Tests for Booking Flow
 * Tests complete end-to-end booking workflows
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import bookingsRouter from '../../src/routes/bookings.js';
import Booking from '../../models/booking.js';
import { connectDB, closeDB, clearDB } from '../helpers/testHelpers.js';

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

const app = express();
app.use(express.json());
app.use('/api/bookings', bookingsRouter);

describe('Booking Flow - Functional Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  describe('Complete Package Booking Flow', () => {
    it('should complete full package booking workflow', async () => {
      // Step 1: Create a package booking
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 7);
      const departureDate = new Date(arrivalDate);
      departureDate.setDate(departureDate.getDate() + 5);

      const bookingData = {
        customerName: 'Alice Johnson',
        phoneNumber: '5551234567',
        emailId: 'alice@example.com',
        bookingType: 'package',
        packageName: 'Bali Adventure Package',
        location: 'Bali, Indonesia',
        arrivalDate: arrivalDate.toISOString(),
        departureDate: departureDate.toISOString(),
        adults: 2,
        children: 1,
        specialRequests: 'Vegetarian meals please',
      };

      const createResponse = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const bookingId = createResponse.body.bookingId;

      // Step 2: Verify booking was created
      const getResponse = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .expect(200);

      expect(getResponse.body.booking.status).toBe('pending');
      expect(getResponse.body.booking.name).toBe(bookingData.customerName);
      expect(getResponse.body.booking.bookingType).toBe('package');

      // Step 3: Update booking status to approved
      const approveResponse = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .send({ status: 'approved' })
        .expect(200);

      expect(approveResponse.body.status).toBe('approved');

      // Step 4: Verify status change
      const verifyResponse = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .expect(200);

      expect(verifyResponse.body.booking.status).toBe('approved');
    });

    it('should handle booking rejection workflow', async () => {
      // Create booking
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 10);
      const departureDate = new Date(arrivalDate);
      departureDate.setDate(departureDate.getDate() + 3);

      const bookingData = {
        customerName: 'Bob Smith',
        phoneNumber: '5559876543',
        emailId: 'bob@example.com',
        bookingType: 'package',
        packageName: 'Maldives Paradise',
        arrivalDate: arrivalDate.toISOString(),
        departureDate: departureDate.toISOString(),
        adults: 1,
      };

      const createResponse = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const bookingId = createResponse.body.bookingId;

      // Reject booking
      const rejectResponse = await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .send({ status: 'rejected' })
        .expect(200);

      expect(rejectResponse.body.status).toBe('rejected');

      // Verify rejection
      const verifyResponse = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .expect(200);

      expect(verifyResponse.body.booking.status).toBe('rejected');
    });
  });

  describe('Complete Stay-Only Booking Flow', () => {
    it('should complete full stay-only booking workflow', async () => {
      // Step 1: Create stay-only booking
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 14);
      const departureDate = new Date(arrivalDate);
      departureDate.setDate(departureDate.getDate() + 4);

      const bookingData = {
        customerName: 'Charlie Brown',
        phoneNumber: '5551112233',
        emailId: 'charlie@example.com',
        bookingType: 'stayOnly',
        hotelName: 'Grand Hotel',
        location: 'Paris, France',
        arrivalDate: arrivalDate.toISOString(),
        departureDate: departureDate.toISOString(),
        adults: 2,
        children: 0,
        roomType: 'Deluxe Suite',
      };

      const createResponse = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      expect(createResponse.body.success).toBe(true);
      const bookingId = createResponse.body.bookingId;

      // Step 2: Retrieve and verify booking
      const getResponse = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .expect(200);

      expect(getResponse.body.booking.bookingType).toBe('stayOnly');
      expect(getResponse.body.booking.hotelName).toBe(bookingData.hotelName);
      expect(getResponse.body.booking.roomType).toBe(bookingData.roomType);

      // Step 3: Approve booking
      await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .send({ status: 'approved' })
        .expect(200);

      // Step 4: Verify final state
      const finalResponse = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .expect(200);

      expect(finalResponse.body.booking.status).toBe('approved');
    });
  });

  describe('Multiple Bookings Management Flow', () => {
    it('should handle multiple bookings from different customers', async () => {
      const bookings = [
        {
          customerName: 'Customer 1',
          phoneNumber: '1111111111',
          emailId: 'customer1@example.com',
          bookingType: 'package',
          packageName: 'Package 1',
          arrivalDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          departureDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          adults: 2,
        },
        {
          customerName: 'Customer 2',
          phoneNumber: '2222222222',
          emailId: 'customer2@example.com',
          bookingType: 'stayOnly',
          hotelName: 'Hotel 1',
          arrivalDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          departureDate: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
          adults: 1,
        },
        {
          customerName: 'Customer 3',
          phoneNumber: '3333333333',
          emailId: 'customer3@example.com',
          bookingType: 'package',
          packageName: 'Package 2',
          arrivalDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
          departureDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          adults: 4,
          children: 2,
        },
      ];

      // Create all bookings
      const createdBookings = [];
      for (const bookingData of bookings) {
        const response = await request(app)
          .post('/api/bookings')
          .send(bookingData)
          .expect(201);
        createdBookings.push(response.body.bookingId);
      }

      // Verify all bookings exist
      const listResponse = await request(app)
        .get('/api/bookings')
        .expect(200);

      expect(listResponse.body.bookings).toHaveLength(3);

      // Update status of each booking
      await request(app)
        .patch(`/api/bookings/${createdBookings[0]}/status`)
        .send({ status: 'approved' })
        .expect(200);

      await request(app)
        .patch(`/api/bookings/${createdBookings[1]}/status`)
        .send({ status: 'approved' })
        .expect(200);

      await request(app)
        .patch(`/api/bookings/${createdBookings[2]}/status`)
        .send({ status: 'rejected' })
        .expect(200);

      // Verify final states
      const finalListResponse = await request(app)
        .get('/api/bookings')
        .expect(200);

      const approvedCount = finalListResponse.body.bookings.filter(
        b => b.status === 'approved'
      ).length;
      const rejectedCount = finalListResponse.body.bookings.filter(
        b => b.status === 'rejected'
      ).length;

      expect(approvedCount).toBe(2);
      expect(rejectedCount).toBe(1);
    });
  });

  describe('Error Handling in Booking Flow', () => {
    it('should handle invalid booking data gracefully', async () => {
      // Try to create booking with invalid data
      const invalidBooking = {
        customerName: '', // Empty name
        phoneNumber: '123',
        emailId: 'invalid-email',
        bookingType: 'invalid',
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(invalidBooking)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle date validation errors', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      const invalidBooking = {
        customerName: 'Test User',
        phoneNumber: '5551234567',
        emailId: 'test@example.com',
        bookingType: 'package',
        packageName: 'Test Package',
        arrivalDate: pastDate.toISOString(),
        departureDate: new Date().toISOString(),
        adults: 2,
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(invalidBooking)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('past');
    });
  });

  describe('Booking Status Transition Flow', () => {
    it('should handle status transitions correctly', async () => {
      // Create booking
      const arrivalDate = new Date();
      arrivalDate.setDate(arrivalDate.getDate() + 7);
      const departureDate = new Date(arrivalDate);
      departureDate.setDate(departureDate.getDate() + 3);

      const bookingData = {
        customerName: 'Status Test User',
        phoneNumber: '5559998888',
        emailId: 'status@example.com',
        bookingType: 'package',
        packageName: 'Status Test Package',
        arrivalDate: arrivalDate.toISOString(),
        departureDate: departureDate.toISOString(),
        adults: 2,
      };

      const createResponse = await request(app)
        .post('/api/bookings')
        .send(bookingData)
        .expect(201);

      const bookingId = createResponse.body.bookingId;

      // Verify initial status is pending
      let getResponse = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .expect(200);
      expect(getResponse.body.booking.status).toBe('pending');

      // Transition to approved
      await request(app)
        .patch(`/api/bookings/${bookingId}/status`)
        .send({ status: 'approved' })
        .expect(200);

      getResponse = await request(app)
        .get(`/api/bookings/${bookingId}`)
        .expect(200);
      expect(getResponse.body.booking.status).toBe('approved');

      // Note: In a real scenario, you might want to test transitioning from approved to rejected
      // but that depends on your business logic
    });
  });
});


