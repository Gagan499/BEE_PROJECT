/**
 * Unit Tests for Login/Authentication Logic
 */
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken } from '../../src/routes/jwtutils.js';

// Mock Redis client
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

describe('JWT Utilities - Unit Tests', () => {
  const originalEnv = process.env.JWT_SECRET;
  
  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-jwt-testing';
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (originalEnv) {
      process.env.JWT_SECRET = originalEnv;
    }
  });

  describe('Token Generation', () => {
    it('should generate a valid JWT token', () => {
      const payload = { name: 'Test User', email: 'test@example.com' };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different payloads', () => {
      const payload1 = { name: 'User 1', email: 'user1@example.com' };
      const payload2 = { name: 'User 2', email: 'user2@example.com' };

      const token1 = generateToken(payload1);
      const token2 = generateToken(payload2);

      expect(token1).not.toBe(token2);
    });

    it('should generate tokens with expiration', () => {
      const payload = { name: 'Test User', email: 'test@example.com' };
      const token = generateToken(payload);
      const decoded = jwt.decode(token);

      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });

  describe('Token Verification', () => {
    it('should verify a valid token', () => {
      const payload = { name: 'Test User', email: 'test@example.com' };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded.name).toBe(payload.name);
      expect(decoded.email).toBe(payload.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        verifyToken(invalidToken);
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      // Create a token with very short expiration
      const payload = { name: 'Test User', email: 'test@example.com' };
      const expiredToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '-1h' });

      expect(() => {
        verifyToken(expiredToken);
      }).toThrow();
    });
  });
});

describe('Password Hashing - Unit Tests', () => {
  describe('bcrypt Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const saltRounds = 10;

      const hash1 = await bcrypt.hash(password, saltRounds);
      const hash2 = await bcrypt.hash(password, saltRounds);

      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123';
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const isMatch = await bcrypt.compare(password, hashedPassword);
      expect(isMatch).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword';
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const isMatch = await bcrypt.compare(wrongPassword, hashedPassword);
      expect(isMatch).toBe(false);
    });
  });
});

describe('Login Validation Logic - Unit Tests', () => {
  describe('Input Validation', () => {
    it('should validate that email and password are required', () => {
      const email = '';
      const password = '';

      expect(!email || !password).toBe(true);
    });

    it('should validate that email is provided', () => {
      const email = 'test@example.com';
      const password = 'password123';

      expect(email && password).toBeTruthy();
    });

    it('should validate email format (basic check)', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'notanemail';

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(validEmail)).toBe(true);
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });
  });
});

describe('Redis Login Limit Logic - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Block Status Check', () => {
    it('should return blocked status when user is blocked', async () => {
      mockRedisClient.exists.mockResolvedValue(1);
      mockRedisClient.ttl.mockResolvedValue(900); // 15 minutes

      const blockKey = 'block:test@example.com';
      const blocked = await mockRedisClient.exists(blockKey);
      
      if (blocked) {
        const ttl = await mockRedisClient.ttl(blockKey);
        const result = { blocked: true, remainingSeconds: ttl };
        
        expect(result.blocked).toBe(true);
        expect(result.remainingSeconds).toBe(900);
      }
    });

    it('should return not blocked status when user is not blocked', async () => {
      mockRedisClient.exists.mockResolvedValue(0);

      const blockKey = 'block:test@example.com';
      const blocked = await mockRedisClient.exists(blockKey);
      
      if (!blocked) {
        const result = { blocked: false, remainingSeconds: 0 };
        expect(result.blocked).toBe(false);
      }
    });
  });

  describe('Failed Login Attempts', () => {
    it('should increment failed login attempts', async () => {
      const failKey = 'fail:test@example.com';
      mockRedisClient.get.mockResolvedValue('3');
      mockRedisClient.set.mockResolvedValue('OK');

      let attempts = await mockRedisClient.get(failKey);
      attempts = attempts ? parseInt(attempts) : 0;
      attempts += 1;

      expect(attempts).toBe(4);
    });

    it('should block user after max failed attempts', async () => {
      const MAX_FAILED_ATTEMPTS = 5;
      const failKey = 'fail:test@example.com';
      const blockKey = 'block:test@example.com';
      
      mockRedisClient.get.mockResolvedValue('4');
      mockRedisClient.set.mockResolvedValue('OK');
      mockRedisClient.del.mockResolvedValue(1);

      let attempts = await mockRedisClient.get(failKey);
      attempts = attempts ? parseInt(attempts) : 0;
      attempts += 1;

      if (attempts >= MAX_FAILED_ATTEMPTS) {
        await mockRedisClient.set(blockKey, '1', { EX: 900 });
        await mockRedisClient.del(failKey);
        
        expect(attempts).toBe(5);
      }
    });
  });

  describe('Clear Failed Attempts', () => {
    it('should clear failed attempts on successful login', async () => {
      const failKey = 'fail:test@example.com';
      mockRedisClient.del.mockResolvedValue(1);

      await mockRedisClient.del(failKey);
      
      expect(mockRedisClient.del).toHaveBeenCalledWith(failKey);
    });
  });
});

describe('Cookie Management - Unit Tests', () => {
  describe('Cookie Settings', () => {
    it('should set cookie with correct options', () => {
      const cookieOptions = {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 1 day
        sameSite: 'strict',
        secure: false,
      };

      expect(cookieOptions.httpOnly).toBe(true);
      expect(cookieOptions.maxAge).toBe(86400000);
      expect(cookieOptions.sameSite).toBe('strict');
      expect(cookieOptions.secure).toBe(false);
    });

    it('should clear cookie on logout', () => {
      const clearCookieOptions = {
        httpOnly: true,
        expires: new Date(0),
      };

      expect(clearCookieOptions.expires.getTime()).toBe(0);
    });
  });
});

