import { catchAsync } from '../utils/catchAsync.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as authService from '../services/auth.service.js';

export const register = catchAsync(async (req, res) => {
  const user = await authService.registerUser(req.body);
  res.status(201).json(new ApiResponse(201, user, 'User registered successfully'));
});

export const login = catchAsync(async (req, res) => {
  const result = await authService.loginUser(req.body);
  res.status(200).json(new ApiResponse(200, result, 'Login successful'));
});

export const refreshToken = catchAsync(async (req, res) => {
  const result = await authService.refreshSession(req.body.refreshToken);
  res.status(200).json(new ApiResponse(200, result, 'Token refreshed successfully'));
});

export const logout = catchAsync(async (req, res) => {
  await authService.logoutUser(req.body.refreshToken);
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});
