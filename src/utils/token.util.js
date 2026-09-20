import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AUTH_CONSTANTS } from '../constants/auth.constants.js';

export const generateAccessToken = (userId) => {
  return jwt.sign(
    { sub: userId.toString() },
    env.JWT_ACCESS_SECRET,
    { expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRY }
  );
};

export const generateRefreshToken = () => {
  return crypto.randomBytes(AUTH_CONSTANTS.REFRESH_TOKEN_BYTES).toString('hex');
};

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export const calculateRefreshTokenExpiry = () => {
  return new Date(Date.now() + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
};
