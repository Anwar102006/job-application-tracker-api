import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  calculateRefreshTokenExpiry,
} from '../utils/token.util.js';

export const registerUser = async ({ name, email, password, headline, targetRole }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    throw new ApiError(409, 'Email address is already registered');
  }

  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    headline,
    targetRole,
  });

  const userObject = user.toObject();
  delete userObject.password;

  return userObject;
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const accessToken = generateAccessToken(user._id);
  const rawRefreshToken = generateRefreshToken();
  const tokenHash = hashToken(rawRefreshToken);
  const expiresAt = calculateRefreshTokenExpiry();

  await RefreshToken.create({
    userId: user._id,
    tokenHash,
    expiresAt,
  });

  const userObject = user.toObject();
  delete userObject.password;

  return {
    user: userObject,
    accessToken,
    refreshToken: rawRefreshToken,
  };
};

export const refreshSession = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    throw new ApiError(400, 'Refresh token is required');
  }

  const tokenHash = hashToken(rawRefreshToken);

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Atomically find and delete the existing refresh token inside the session
    const existingRecord = await RefreshToken.findOneAndDelete({ tokenHash }, { session });

    if (!existingRecord) {
      throw new ApiError(401, 'Invalid or revoked refresh token');
    }

    if (existingRecord.expiresAt < new Date()) {
      throw new ApiError(401, 'Refresh token has expired. Please log in again.');
    }

    const newRawRefreshToken = generateRefreshToken();
    const newTokenHash = hashToken(newRawRefreshToken);
    const expiresAt = calculateRefreshTokenExpiry();

    await RefreshToken.create(
      [{ userId: existingRecord.userId, tokenHash: newTokenHash, expiresAt }],
      { session }
    );

    const accessToken = generateAccessToken(existingRecord.userId);

    await session.commitTransaction();

    return {
      accessToken,
      refreshToken: newRawRefreshToken,
    };
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    await session.endSession();
  }
};

export const logoutUser = async (rawRefreshToken) => {
  if (!rawRefreshToken) {
    throw new ApiError(400, 'Refresh token is required');
  }

  const tokenHash = hashToken(rawRefreshToken);
  await RefreshToken.deleteOne({ tokenHash });
};
