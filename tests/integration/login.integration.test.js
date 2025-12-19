/**
 * Integration Tests for Login/Auth API
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import authRouter from '../../src/routes/auth.js';
import user from '../../models/user.js';
import { connectDB, closeDB, clearDB, createMockUser } from '../helpers/testHelpers.js';

// Mock Redis
const mockRedisClient = {
  get: jest.fn(),
  set: jest.fn(),
  exists: jest.fn(),
  del: jest.fn(),
  ttl: jest.fn(),
};

jest.mock('../../src/redis_server.js', () => ({
  __esModule: true,
  default: mockRedisClient,
}));

jest.mock('../../src/routes/loginlimit_redis.js', () => ({
  FailedLoginPerDay: jest.fn().mockResolvedValue(undefined),
  isBlocked: jest.fn().mockResolvedValue({ blocked: false, remainingSeconds: 0 }),
  clearFailedAttempts: jest.fn().mockResolvedValue(undefined),
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

jest.mock('../../src/routes/forgot_mail.js', () => ({
  sendForgotPasswordMail: jest.fn((req, res) => {
    res.json({ success: true, message: 'Password reset email sent' });
  }),
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Auth API - Integration Tests', () => {
  beforeAll(async () => {
    await connectDB();
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
  });

  afterAll(async () => {
    await closeDB();
  });

  beforeEach(async () => {
    await clearDB();
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register - User Registration', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Registeration done');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.password).toBeUndefined();

      // Verify user was saved in database
      const savedUser = await user.findOne({ email: userData.email });
      expect(savedUser).toBeDefined();
      expect(savedUser.name).toBe(userData.name);
      expect(await bcrypt.compare(userData.password, savedUser.password)).toBe(true);
    });

    it('should fail when required fields are missing', async () => {
      const userData = {
        name: 'Test User',
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    it('should fail when email is already in use', async () => {
      const userData = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'password123',
      };

      // Create existing user
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      await new user({
        name: 'Existing User',
        email: userData.email,
        password: hashedPassword,
      }).save();

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already in use');
    });

    it('should hash password before saving', async () => {
      const userData = {
        name: 'Test User',
        email: 'hashtest@example.com',
        password: 'password123',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const savedUser = await user.findOne({ email: userData.email });
      expect(savedUser.password).not.toBe(userData.password);
      expect(savedUser.password.length).toBeGreaterThan(20); // bcrypt hash length
    });
  });

  describe('POST /api/auth/login - User Login', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await new user({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      }).save();
    });

    it('should login successfully with correct credentials', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Login successful');
      expect(response.body.token).toBeDefined();

      // Check cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies.some(cookie => cookie.includes('token'))).toBe(true);
    });

    it('should fail when email is missing', async () => {
      const loginData = {
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email and Password required');
    });

    it('should fail when password is missing', async () => {
      const loginData = {
        email: 'test@example.com',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email and Password required');
    });

    it('should fail with incorrect email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should fail with incorrect password', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should return 429 when user is blocked', async () => {
      const { isBlocked } = await import('../../src/routes/loginlimit_redis.js');
      isBlocked.mockResolvedValueOnce({ blocked: true, remainingSeconds: 900 });

      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.blocked).toBe(true);
      expect(response.body.message).toContain('blocked');
    });
  });

  describe('GET /api/auth/login/status - Check Login Status', () => {
    it('should return not logged in when no token provided', async () => {
      const response = await request(app)
        .get('/api/auth/login/status')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.LoggedIn).toBe(false);
    });

    it('should return logged in status with valid token', async () => {
      // Create user and get token
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testUser = await new user({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      }).save();

      // Login to get token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const token = loginResponse.body.token;

      // Check status with token
      const response = await request(app)
        .get('/api/auth/login/status')
        .set('Cookie', `token=${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.LoggedIn).toBe(true);
      expect(response.body.name).toBe(testUser.name);
    });

    it('should return not logged in with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/login/status')
        .set('Cookie', 'token=invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.LoggedIn).toBe(false);
    });
  });

  describe('POST /api/auth/logout - User Logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Logged out');

      // Check cookie is cleared
      const cookies = response.headers['set-cookie'];
      if (cookies) {
        const tokenCookie = cookies.find(cookie => cookie.includes('token'));
        if (tokenCookie) {
          expect(tokenCookie).toContain('Max-Age=0');
        }
      }
    });
  });

  describe('GET /api/auth/me - Get Current User', () => {
    it('should return current user with valid token', async () => {
      // Create user and login
      const hashedPassword = await bcrypt.hash('password123', 10);
      const testUser = await new user({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      }).save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const token = loginResponse.body.token;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(testUser.email);
      expect(response.body.user.name).toBe(testUser.name);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Not authenticated');
    });
  });
});


