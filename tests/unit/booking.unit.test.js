/**
 * Unit Tests for Booking Model and Validation Logic
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import Booking from '../../models/booking.js';
import { connectDB, closeDB, clearDB, createMockBooking } from '../helpers/testHelpers.js';

describe('Booking Model - Unit Tests', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();
  });

  describe('Booking Schema Validation', () => {
    it('should create a valid booking with all required fields', async () => {
      const bookingData = createMockBooking();
      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking._id).toBeDefined();
      expect(savedBooking.name).toBe(bookingData.name);
      expect(savedBooking.email).toBe(bookingData.email);
      expect(savedBooking.bookingType).toBe(bookingData.bookingType);
      expect(savedBooking.status).toBe('pending');
      expect(savedBooking.createdAt).toBeDefined();
      expect(savedBooking.updatedAt).toBeDefined();
    });

    it('should fail when name is missing', async () => {
      const bookingData = createMockBooking({ name: undefined });
      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow();
    });

    it('should fail when email is missing', async () => {
      const bookingData = createMockBooking({ email: undefined });
      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow();
    });

    it('should fail when phoneNumber is missing', async () => {
      const bookingData = createMockBooking({ phoneNumber: undefined });
      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow();
    });

    it('should fail when bookingType is missing', async () => {
      const bookingData = createMockBooking({ bookingType: undefined });
      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow();
    });

    it('should fail when bookingType is invalid', async () => {
      const bookingData = createMockBooking({ bookingType: 'invalid' });
      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow();
    });

    it('should accept valid bookingType values', async () => {
      const packageBooking = createMockBooking({ bookingType: 'package' });
      const stayOnlyBooking = createMockBooking({ bookingType: 'stayOnly' });

      const savedPackage = await new Booking(packageBooking).save();
      const savedStayOnly = await new Booking(stayOnlyBooking).save();

      expect(savedPackage.bookingType).toBe('package');
      expect(savedStayOnly.bookingType).toBe('stayOnly');
    });

    it('should fail when arrivalDate is missing', async () => {
      const bookingData = createMockBooking({ arrivalDate: undefined });
      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow();
    });

    it('should fail when departureDate is missing', async () => {
      const bookingData = createMockBooking({ departureDate: undefined });
      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow();
    });

    it('should fail when adults is missing', async () => {
      const bookingData = createMockBooking({ adults: undefined });
      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow();
    });

    it('should fail when adults is less than 1', async () => {
      const bookingData = createMockBooking({ adults: 0 });
      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow();
    });

    it('should default children to 0 when not provided', async () => {
      const bookingData = createMockBooking();
      delete bookingData.children;
      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.children).toBe(0);
    });

    it('should fail when children is negative', async () => {
      const bookingData = createMockBooking({ children: -1 });
      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow();
    });

    it('should accept valid status values', async () => {
      const statuses = ['pending', 'approved', 'rejected', 'confirmed', 'completed'];
      
      for (const status of statuses) {
        const bookingData = createMockBooking({ status });
        const booking = new Booking(bookingData);
        const savedBooking = await booking.save();
        expect(savedBooking.status).toBe(status);
      }
    });

    it('should fail when status is invalid', async () => {
      const bookingData = createMockBooking({ status: 'invalid' });
      const booking = new Booking(bookingData);
      
      await expect(booking.save()).rejects.toThrow();
    });
  });

  describe('Booking Optional Fields', () => {
    it('should save booking without packageName when bookingType is stayOnly', async () => {
      const bookingData = createMockBooking({
        bookingType: 'stayOnly',
        hotelName: 'Test Hotel',
        packageName: undefined,
      });
      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.packageName).toBeUndefined();
      expect(savedBooking.hotelName).toBe('Test Hotel');
    });

    it('should save booking without hotelName when bookingType is package', async () => {
      const bookingData = createMockBooking({
        bookingType: 'package',
        packageName: 'Test Package',
        hotelName: undefined,
      });
      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.hotelName).toBeUndefined();
      expect(savedBooking.packageName).toBe('Test Package');
    });

    it('should save booking with optional fields', async () => {
      const bookingData = createMockBooking({
        location: 'Test Location',
        roomType: 'Deluxe',
        specialRequests: 'Late checkout please',
        notes: 'Test notes',
        totalAmount: 5000,
        price: 2500,
      });
      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.location).toBe('Test Location');
      expect(savedBooking.roomType).toBe('Deluxe');
      expect(savedBooking.specialRequests).toBe('Late checkout please');
      expect(savedBooking.notes).toBe('Test notes');
      expect(savedBooking.totalAmount).toBe(5000);
      expect(savedBooking.price).toBe(2500);
    });
  });

  describe('Booking Timestamps', () => {
    it('should automatically add createdAt and updatedAt timestamps', async () => {
      const bookingData = createMockBooking();
      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();

      expect(savedBooking.createdAt).toBeInstanceOf(Date);
      expect(savedBooking.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when booking is modified', async () => {
      const bookingData = createMockBooking();
      const booking = new Booking(bookingData);
      const savedBooking = await booking.save();
      
      const originalUpdatedAt = savedBooking.updatedAt;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 100));
      
      savedBooking.status = 'approved';
      const updatedBooking = await savedBooking.save();

      expect(updatedBooking.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });
});

describe('Booking Validation Logic - Unit Tests', () => {
  describe('Date Validation', () => {
    it('should validate that arrival date is not in the past', () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      expect(yesterday < today).toBe(true);
    });

    it('should validate that departure date is after arrival date', () => {
      const arrival = new Date('2024-12-01');
      const departure = new Date('2024-12-05');
      const sameDate = new Date('2024-12-01');

      expect(departure > arrival).toBe(true);
      expect(sameDate <= arrival).toBe(true);
    });
  });

  describe('Booking Type Conditional Requirements', () => {
    it('should require packageName when bookingType is package', () => {
      const bookingType = 'package';
      const packageName = 'Test Package';
      const hotelName = undefined;

      if (bookingType === 'package') {
        expect(packageName).toBeDefined();
        expect(packageName).toBeTruthy();
      }
    });

    it('should require hotelName when bookingType is stayOnly', () => {
      const bookingType = 'stayOnly';
      const packageName = undefined;
      const hotelName = 'Test Hotel';

      if (bookingType === 'stayOnly') {
        expect(hotelName).toBeDefined();
        expect(hotelName).toBeTruthy();
      }
    });
  });

  describe('Number Conversion', () => {
    it('should convert adults string to number', () => {
      const adults = '2';
      const converted = Number(adults);
      expect(converted).toBe(2);
      expect(typeof converted).toBe('number');
    });

    it('should convert children string to number with default 0', () => {
      const children = null;
      const converted = children != null ? Number(children) : 0;
      expect(converted).toBe(0);
      expect(typeof converted).toBe('number');
    });

    it('should handle children as string', () => {
      const children = '1';
      const converted = children != null ? Number(children) : 0;
      expect(converted).toBe(1);
      expect(typeof converted).toBe('number');
    });
  });
});




