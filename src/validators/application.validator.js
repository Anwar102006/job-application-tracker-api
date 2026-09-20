import { z } from 'zod';
import {
  APPLICATION_STATUS_LIST,
  JOB_TYPES,
  WORKPLACE_TYPES,
  PRIORITY_LEVELS,
  SALARY_PERIODS,
} from '../constants/applicationStatus.js';

const salarySchema = z
  .object({
    min: z.number().nonnegative('Minimum salary cannot be negative').nullable().optional(),
    max: z.number().nonnegative('Maximum salary cannot be negative').nullable().optional(),
    currency: z.string().trim().length(3, 'Currency must be a 3-letter code').optional(),
    period: z.enum(SALARY_PERIODS).optional(),
  })
  .strict({ message: 'Unrecognized fields in salary object' });

export const createApplicationSchema = z.object({
  body: z
    .object({
      company: z
        .string({ required_error: 'Company name is required' })
        .trim()
        .min(1, 'Company name cannot be empty')
        .max(100, 'Company name cannot exceed 100 characters'),
      jobTitle: z
        .string({ required_error: 'Job title is required' })
        .trim()
        .min(1, 'Job title cannot be empty')
        .max(100, 'Job title cannot exceed 100 characters'),
      jobType: z.enum(JOB_TYPES).optional(),
      workplaceType: z.enum(WORKPLACE_TYPES).optional(),
      location: z.string().trim().max(100, 'Location cannot exceed 100 characters').optional(),
      salary: salarySchema.optional(),
      jobUrl: z.string().trim().max(500, 'Job URL cannot exceed 500 characters').optional(),
      status: z.enum(APPLICATION_STATUS_LIST).optional(),
      priority: z.enum(PRIORITY_LEVELS).optional(),
      appliedDate: z.coerce.date().optional(),
      deadline: z.coerce.date().nullable().optional(),
      notes: z.string().max(2000, 'Notes cannot exceed 2000 characters').optional(),
      tags: z.array(z.string().trim()).optional(),
    })
    .strict({ message: 'Unrecognized fields in application creation payload' }),
});

export const updateApplicationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID format'),
  }),
  body: z
    .object({
      company: z.string().trim().min(1, 'Company name cannot be empty').max(100).optional(),
      jobTitle: z.string().trim().min(1, 'Job title cannot be empty').max(100).optional(),
      jobType: z.enum(JOB_TYPES).optional(),
      workplaceType: z.enum(WORKPLACE_TYPES).optional(),
      location: z.string().trim().max(100).optional(),
      salary: salarySchema.optional(),
      jobUrl: z.string().trim().max(500).optional(),
      status: z.enum(APPLICATION_STATUS_LIST).optional(),
      priority: z.enum(PRIORITY_LEVELS).optional(),
      appliedDate: z.coerce.date().optional(),
      deadline: z.coerce.date().nullable().optional(),
      notes: z.string().max(2000).optional(),
      tags: z.array(z.string().trim()).optional(),
    })
    .strict({ message: 'Unrecognized fields in application update payload' })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});

export const mongoIdParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid application ID format'),
  }),
});

export const queryApplicationsSchema = z.object({
  query: z
    .object({
      search: z.string().trim().optional(),
      status: z.enum(APPLICATION_STATUS_LIST).optional(),
      priority: z.enum(PRIORITY_LEVELS).optional(),
      jobType: z.enum(JOB_TYPES).optional(),
      workplaceType: z.enum(WORKPLACE_TYPES).optional(),
      isArchived: z
        .enum(['true', 'false'])
        .transform((val) => val === 'true')
        .optional(),
      sortBy: z
        .enum(['appliedDate', 'company', 'jobTitle', 'priority', 'status', 'createdAt'])
        .default('appliedDate'),
      sortOrder: z.enum(['asc', 'desc']).default('desc'),
      page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
      limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(10),
    })
    .strict({ message: 'Unrecognized query parameter' }),
});
