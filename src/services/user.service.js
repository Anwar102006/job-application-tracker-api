import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { RefreshToken } from '../models/RefreshToken.js';
import { ApiError } from '../utils/ApiError.js';

export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

export const updateProfile = async (userId, updateData) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  Object.assign(user, updateData);
  await user.save();

  return user;
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select('+password');
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  const isPasswordValid = await user.comparePassword(currentPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid current password');
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    user.password = newPassword;
    await user.save({ session });

    // Atomically revoke all active refresh tokens across all devices
    await RefreshToken.deleteMany({ userId }, { session });

    await session.commitTransaction();

    return {
      message: 'Password changed successfully. All active sessions have been revoked.',
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
