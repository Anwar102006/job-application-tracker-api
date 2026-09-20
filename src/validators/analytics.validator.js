import { z } from 'zod';

export const monthlyTrendsQuerySchema = z.object({
  query: z
    .object({
      months: z.coerce
        .number({ invalid_type_error: 'Months must be a valid number' })
        .int('Months must be an integer')
        .min(1, 'Months must be at least 1')
        .max(24, 'Months cannot exceed 24')
        .default(6),
    })
    .strict({ message: 'Unrecognized query parameters' }),
});
