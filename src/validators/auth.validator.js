import { z } from 'zod';

export const registerSchema = z.object({
  body: z
    .object({
      name: z
        .string({ required_error: 'Name is required' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters'),
      email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .email('Invalid email address')
        .toLowerCase(),
      password: z
        .string({ required_error: 'Password is required' })
        .min(8, 'Password must be at least 8 characters'),
      headline: z.string().trim().max(100, 'Headline cannot exceed 100 characters').optional(),
      targetRole: z.string().trim().max(100, 'Target role cannot exceed 100 characters').optional(),
    })
    .strict({ message: 'Unrecognized fields in registration request' }),
});

export const loginSchema = z.object({
  body: z
    .object({
      email: z
        .string({ required_error: 'Email is required' })
        .trim()
        .email('Invalid email address')
        .toLowerCase(),
      password: z
        .string({ required_error: 'Password is required' })
        .min(1, 'Password is required'),
    })
    .strict({ message: 'Unrecognized fields in login request' }),
});

export const refreshTokenSchema = z.object({
  body: z
    .object({
      refreshToken: z
        .string({ required_error: 'Refresh token is required' })
        .min(1, 'Refresh token is required'),
    })
    .strict({ message: 'Unrecognized fields in refresh-token request' }),
});

export const logoutSchema = z.object({
  body: z
    .object({
      refreshToken: z
        .string({ required_error: 'Refresh token is required' })
        .min(1, 'Refresh token is required'),
    })
    .strict({ message: 'Unrecognized fields in logout request' }),
});
