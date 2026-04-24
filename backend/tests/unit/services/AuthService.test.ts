import { AuthService } from '@services/AuthService';
import { userRepository } from '@repositories/UserRepository';
import { ConflictError, UnauthorizedError } from '@utils/errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock the UserRepository module
jest.mock('@repositories/UserRepository', () => ({
  UserRepository: jest.fn().mockImplementation(() => ({
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    emailExists: jest.fn(),
  })),
  userRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    emailExists: jest.fn(),
  },
}));

// Mock external libraries
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should throw ConflictError if email already exists', async () => {
      userRepository.findByEmail = jest.fn().mockResolvedValue({
        id: 'existing-user-id',
        email: 'existing@example.com',
        name: 'Existing User',
      }) as any;

      await expect(authService.register({
        email: 'existing@example.com',
        name: 'Test User',
        password: 'SecurePass123',
      })).rejects.toThrow(ConflictError);
    });

    it('should return user and token on successful registration', async () => {
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);
      userRepository.create = jest.fn().mockResolvedValue({
        id: 'new-user-id',
        email: 'new@example.com',
        name: 'New User',
        created_at: new Date(),
      }) as any;

      const result = await authService.register({
        email: 'new@example.com',
        name: 'New User',
        password: 'SecurePass123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email');
      expect(result.user).toHaveProperty('name');
      expect(result.user).not.toHaveProperty('password_hash');
    });
  });

  describe('login', () => {
    it('should throw UnauthorizedError for invalid credentials', async () => {
      userRepository.findByEmail = jest.fn().mockResolvedValue(null);

      await expect(authService.login({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      })).rejects.toThrow(UnauthorizedError);
    });

    it('should return user and token on successful login', async () => {
      userRepository.findByEmail = jest.fn().mockResolvedValue({
        id: 'user-id',
        email: 'user@example.com',
        name: 'Test User',
        password_hash: '$2b$10$hashedpassword', // Mock hash
      }) as any;

      // Mock bcrypt.compare to return true
      (bcrypt.compare as jest.Mock).mockResolvedValue(true as never);

      const result = await authService.login({
        email: 'user@example.com',
        password: 'correctpassword',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user).not.toHaveProperty('password_hash');
    });
  });

  describe('verifyToken', () => {
    it('should return userId for valid token', () => {
      // This would use a real token in actual tests
      const mockToken = 'valid.jwt.token';

      // Mock jwt.verify
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id' } as never);

      expect(() => {
        authService.verifyToken(mockToken);
      }).not.toThrow();
    });

    it('should throw UnauthorizedError for invalid token', () => {
      const invalidToken = 'invalid.token';

      // Mock jwt.verify to throw error
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      expect(() => {
        authService.verifyToken(invalidToken);
      }).toThrow(UnauthorizedError);
    });
  });
});
