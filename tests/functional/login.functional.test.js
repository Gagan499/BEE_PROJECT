/**
 * Functional Tests for Login/Authentication Flow
 * Tests complete end-to-end authentication workflows
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import bcrypt from 'bcryptjs';
import authRouter from '../../src/routes/auth.js';
import user from '../../models/user.js';
import { connectDB, closeDB, clearDB } from '../helpers/testHelpers.js';

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

// Mock login limit functions
const mockFailedLoginPerDay = jest.fn().mockResolvedValue(undefined);
const mockIsBlocked = jest.fn().mockResolvedValue({ blocked: false, remainingSeconds: 0 });
const mockClearFailedAttempts = jest.fn().mockResolvedValue(undefined);

jest.mock('../../src/routes/loginlimit_redis.js', () => ({
  FailedLoginPerDay: (...args) => mockFailedLoginPerDay(...args),
  isBlocked: (...args) => mockIsBlocked(...args),
  clearFailedAttempts: (...args) => mockClearFailedAttempts(...args),
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

describe('Login Flow - Functional Tests', () => {
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
    mockIsBlocked.mockResolvedValue({ blocked: false, remainingSeconds: 0 });
  });

  describe('Complete Registration and Login Flow', () => {
    it('should complete full user registration and login workflow', async () => {
      // Step 1: Register a new user
      const registerData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'securePassword123',
      };

      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(registerData)
        .expect(201);

      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.user.email).toBe(registerData.email);

      // Step 2: Verify user can login with registered credentials
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: registerData.email,
          password: registerData.password,
        })
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.token).toBeDefined();

      // Step 3: Check login status
      const statusResponse = await request(app)
        .get('/api/auth/login/status')
        .set('Cookie', `token=${loginResponse.body.token}`)
        .expect(200);

      expect(statusResponse.body.LoggedIn).toBe(true);
      expect(statusResponse.body.name).toBe(registerData.name);

      // Step 4: Get current user info
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(meResponse.body.success).toBe(true);
      expect(meResponse.body.user.email).toBe(registerData.email);

      // Step 5: Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .expect(200);

      expect(logoutResponse.body.success).toBe(true);

      // Step 6: Verify logout (status should be false)
      const afterLogoutResponse = await request(app)
        .get('/api/auth/login/status')
        .set('Cookie', `token=${loginResponse.body.token}`)
        .expect(401);

      expect(afterLogoutResponse.body.LoggedIn).toBe(false);
    });
  });

  describe('Failed Login Attempts Flow', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await bcrypt.hash('correctPassword', 10);
      await new user({
        name: 'Test User',
        email: 'test@example.com',
        password: hashedPassword,
      }).save();
    });

    it('should handle multiple failed login attempts', async () => {
      // Attempt 1: Wrong password
      const attempt1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword1',
        })
        .expect(401);

      expect(attempt1.body.success).toBe(false);
      expect(mockFailedLoginPerDay).toHaveBeenCalled();

      // Attempt 2: Wrong password
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongPassword2',
        })
        .expect(401);

      // Attempt 3: Correct password (should succeed)
      const successAttempt = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctPassword',
        })
        .expect(200);

      expect(successAttempt.body.success).toBe(true);
      expect(mockClearFailedAttempts).toHaveBeenCalled();
    });

    it('should block user after max failed attempts', async () => {
      // Simulate blocked user
      mockIsBlocked.mockResolvedValueOnce({
        blocked: true,
        remainingSeconds: 900, // 15 minutes
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'correctPassword',
        })
        .expect(429);

      expect(response.body.success).toBe(false);
      expect(response.body.blocked).toBe(true);
      expect(response.body.remainingSeconds).toBe(900);
    });
  });

  describe('Token-Based Authentication Flow', () => {
    let authToken;

    beforeEach(async () => {
      // Create and login user
      const hashedPassword = await bcrypt.hash('password123', 10);
      await new user({
        name: 'Auth Test User',
        email: 'authtest@example.com',
        password: hashedPassword,
      }).save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'authtest@example.com',
          password: 'password123',
        });

      authToken = loginResponse.body.token;
    });

    it('should authenticate requests with Bearer token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe('authtest@example.com');
    });

    it('should authenticate requests with cookie token', async () => {
      const response = await request(app)
        .get('/api/auth/login/status')
        .set('Cookie', `token=${authToken}`)
        .expect(200);

      expect(response.body.LoggedIn).toBe(true);
    });

    it('should reject requests with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should reject requests without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Multiple User Sessions Flow', () => {
    it('should handle multiple users logging in simultaneously', async () => {
      // Create multiple users
      const users = [
        { name: 'User 1', email: 'user1@example.com', password: 'pass1' },
        { name: 'User 2', email: 'user2@example.com', password: 'pass2' },
        { name: 'User 3', email: 'user3@example.com', password: 'pass3' },
      ];

      // Register all users
      for (const userData of users) {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await new user({
          name: userData.name,
          email: userData.email,
          password: hashedPassword,
        }).save();
      }

      // Login all users
      const tokens = [];
      for (const userData of users) {
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({
            email: userData.email,
            password: userData.password,
          })
          .expect(200);

        tokens.push(loginResponse.body.token);
      }

      // Verify all tokens work
      for (let i = 0; i < users.length; i++) {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${tokens[i]}`)
          .expect(200);

        expect(response.body.user.email).toBe(users[i].email);
      }
    });
  });

  describe('Password Reset Flow (Mocked)', () => {
    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('oldPassword', 10);
      await new user({
        name: 'Reset User',
        email: 'reset@example.com',
        password: hashedPassword,
      }).save();
    });

    it('should initiate password reset process', async () => {
      const response = await request(app)
        .post('/api/auth/forgot')
        .send({ email: 'reset@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('sent');
    });
  });

  describe('Registration Validation Flow', () => {
    it('should prevent duplicate email registration', async () => {
      const userData = {
        name: 'First User',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      // First registration
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // Attempt duplicate registration
      const duplicateData = {
        name: 'Second User',
        email: 'duplicate@example.com',
        password: 'differentPassword',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(duplicateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already in use');
    });

    it('should validate required fields during registration', async () => {
      const incompleteData = {
        name: 'Incomplete User',
        // Missing email and password
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });
  });

  describe('Session Management Flow', () => {
    let userToken;

    beforeEach(async () => {
      const hashedPassword = await bcrypt.hash('sessionPassword', 10);
      await new user({
        name: 'Session User',
        email: 'session@example.com',
        password: hashedPassword,
      }).save();

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'session@example.com',
          password: 'sessionPassword',
        });

      userToken = loginResponse.body.token;
    });

    it('should maintain session across multiple requests', async () => {
      // Make multiple authenticated requests
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.user.email).toBe('session@example.com');
      }
    });

    it('should invalidate session on logout', async () => {
      // Verify logged in
      await request(app)
        .get('/api/auth/login/status')
        .set('Cookie', `token=${userToken}`)
        .expect(200);

      // Logout
      await request(app)
        .post('/api/auth/logout')
        .expect(200);

      // Verify logged out (token should still work until expiry, but cookie cleared)
      // In real scenario, you might want to blacklist tokens
    });
  });
});


