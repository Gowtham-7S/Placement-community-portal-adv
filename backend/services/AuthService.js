const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { AppError } = require('../middlewares/errorHandler');
const constants = require('../config/constants');

/**
 * Authentication Service
 * Handles user registration, login, and token management
 */
class AuthService {
  /**
   * Register new user
   */
  static async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await User.findByEmail(userData.email);
      if (existingUser) {
        throw new AppError(
          constants.ERROR_EMAIL_EXISTS,
          constants.HTTP_CONFLICT,
          'EMAIL_EXISTS'
        );
      }

      // Hash password
      const passwordHash = await hashPassword(userData.password);

      // Create user
      const newUser = await User.create({
        email: userData.email,
        passwordHash,
        firstName: userData.first_name,
        lastName: userData.last_name,
        role: userData.role || 'junior',
        phone: userData.phone,
        department: userData.department,
        batchYear: userData.batch_year,
      });

      // Generate tokens
      const tokens = generateTokens(newUser);

      return {
        user: newUser,
        tokens,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Registration error: ${error.message}`);
    }
  }

  /**
   * Login user
   */
  static async login(email, password) {
    try {
      // Find user by email
      const user = await User.findByEmail(email);
      if (!user) {
        throw new AppError(
          constants.ERROR_INVALID_CREDENTIALS,
          constants.HTTP_UNAUTHORIZED,
          'INVALID_CREDENTIALS'
        );
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw new AppError(
          constants.ERROR_INVALID_CREDENTIALS,
          constants.HTTP_UNAUTHORIZED,
          'INVALID_CREDENTIALS'
        );
      }

      // Check if user is active
      if (!user.is_active) {
        throw new AppError(
          'User account is inactive',
          constants.HTTP_UNAUTHORIZED,
          'USER_INACTIVE'
        );
      }

      // Update last login
      await User.updateLastLogin(user.id);

      // Generate tokens
      const tokens = generateTokens(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
        },
        tokens,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Login error: ${error.message}`);
    }
  }

  /**
   * Get user profile
   */
  static async getUserProfile(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new AppError(
          constants.ERROR_USER_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'USER_NOT_FOUND'
        );
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Get profile error: ${error.message}`);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(userId, updates) {
    try {
      const user = await User.updateProfile(userId, updates);
      if (!user) {
        throw new AppError(
          constants.ERROR_USER_NOT_FOUND,
          constants.HTTP_NOT_FOUND,
          'USER_NOT_FOUND'
        );
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new Error(`Update profile error: ${error.message}`);
    }
  }
}

// Helper function to generate tokens using HS256 (JWT_SECRET)
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  // Simple Mode: One token valid for 7 days
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { accessToken };
};

module.exports = AuthService;
