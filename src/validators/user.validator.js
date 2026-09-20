import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z
    .object({
      name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name cannot exceed 50 characters')
        .optional(),
      headline: z
        .string()
        .trim()
        .max(100, 'Headline cannot exceed 100 characters')
        .optional(),
      targetRole: z
        .string()
        .trim()
        .max(100, 'Target role cannot exceed 100 characters')
        .optional(),
    })
    .strict({ message: 'Unrecognized or protected fields in profile update payload' })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

export const changePasswordSchema = z.object({
  body: z
    .object({
      currentPassword: z
        .string({ required_error: 'Current password is required' })
        .min(8, 'Current password must be at least 8 characters'),
      newPassword: z
        .string({ required_error: 'New password is required' })
        .min(8, 'New password must be at least 8 characters'),
    })
    .strict({ message: 'Unrecognized fields in change password payload' })
    .refine((data) => data.currentPassword !== data.newPassword, {
      message: 'New password cannot be the same as the current password',
      path: ['newPassword'],
    }),
});
