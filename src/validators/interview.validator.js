import { z } from 'zod';
import {
  INTERVIEW_ROUNDS,
  INTERVIEW_FORMATS,
  INTERVIEW_STATUS_LIST,
} from '../constants/interviewStatus.js';

const mongoIdRegex = /^[0-9a-fA-F]{24}$/;

export const applicationIdParamSchema = z.object({
  params: z
    .object({
      applicationId: z.string().regex(mongoIdRegex, 'Invalid application ID format'),
    })
    .strict(),
});

export const mongoIdParamSchema = z.object({
  params: z
    .object({
      id: z.string().regex(mongoIdRegex, 'Invalid interview ID format'),
    })
    .strict(),
});

export const createInterviewSchema = z.object({
  params: z
    .object({
      applicationId: z.string().regex(mongoIdRegex, 'Invalid application ID format'),
    })
    .strict(),
  body: z
    .object({
      round: z.enum(INTERVIEW_ROUNDS, {
        required_error: 'Interview round is required',
        invalid_type_error: 'Invalid interview round',
      }),
      interviewDate: z.coerce.date({
        required_error: 'Interview date is required',
        invalid_type_error: 'Invalid interview date format',
      }),
      durationMinutes: z.coerce
        .number({ invalid_type_error: 'Duration must be a number' })
        .int('Duration must be an integer')
        .min(15, 'Duration must be at least 15 minutes')
        .max(480, 'Duration cannot exceed 480 minutes')
        .optional(),
      format: z.enum(INTERVIEW_FORMATS).optional(),
      meetingLink: z.string().trim().max(500, 'Meeting link cannot exceed 500 characters').optional(),
      interviewers: z.array(z.string().trim()).optional(),
      notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
    })
    .strict({ message: 'Unrecognized or protected fields in interview creation payload' }),
});

export const updateInterviewSchema = z.object({
  params: z
    .object({
      id: z.string().regex(mongoIdRegex, 'Invalid interview ID format'),
    })
    .strict(),
  body: z
    .object({
      round: z.enum(INTERVIEW_ROUNDS).optional(),
      interviewDate: z.coerce.date().optional(),
      durationMinutes: z.coerce
        .number()
        .int('Duration must be an integer')
        .min(15, 'Duration must be at least 15 minutes')
        .max(480, 'Duration cannot exceed 480 minutes')
        .optional(),
      format: z.enum(INTERVIEW_FORMATS).optional(),
      meetingLink: z.string().trim().max(500).optional(),
      interviewers: z.array(z.string().trim()).optional(),
      status: z.enum(INTERVIEW_STATUS_LIST).optional(),
      notes: z.string().max(2000).optional(),
    })
    .strict({ message: 'Unrecognized or protected fields in interview update payload' })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

export const queryInterviewsSchema = z.object({
  query: z
    .object({
      status: z.enum(INTERVIEW_STATUS_LIST).optional(),
      startDate: z.coerce.date().optional(),
      endDate: z.coerce.date().optional(),
      sortBy: z
        .enum(['interviewDate', 'createdAt', 'durationMinutes'])
        .default('interviewDate'),
      sortOrder: z.enum(['asc', 'desc']).default('asc'),
      page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
      limit: z.coerce
        .number()
        .int()
        .min(1, 'Limit must be at least 1')
        .max(100, 'Limit cannot exceed 100')
        .default(10),
    })
    .strict({ message: 'Unrecognized query parameter' })
    .refine(
      (data) => {
        if (data.startDate && data.endDate && data.startDate > data.endDate) {
          return false;
        }
        return true;
      },
      { message: 'startDate cannot be after endDate', path: ['startDate'] }
    ),
});

export const upcomingInterviewsSchema = z.object({
  query: z
    .object({
      days: z.coerce
        .number({ invalid_type_error: 'Days must be a number' })
        .int('Days must be an integer')
        .min(1, 'Days must be at least 1')
        .max(365, 'Days cannot exceed 365')
        .default(7),
    })
    .strict({ message: 'Unrecognized query parameter' }),
});
