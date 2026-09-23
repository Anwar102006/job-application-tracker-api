import { describe, it, expect } from 'vitest';
import { getErrorMessage } from '../errorUtils';

describe('errorUtils (Backend Envelope Error Extractor)', () => {
  it('extracts top-level envelope message from response.data', () => {
    const error = {
      response: {
        data: {
          success: false,
          message: 'Invalid email or password',
        },
      },
    };
    expect(getErrorMessage(error)).toBe('Invalid email or password');
  });

  it('extracts string error field from response.data if message is absent', () => {
    const error = {
      response: {
        data: {
          error: 'Rate limit exceeded',
        },
      },
    };
    expect(getErrorMessage(error)).toBe('Rate limit exceeded');
  });

  it('extracts nested error.message from response.data', () => {
    const error = {
      response: {
        data: {
          error: {
            code: 400,
            message: 'Validation failed on email format',
          },
        },
      },
    };
    expect(getErrorMessage(error)).toBe('Validation failed on email format');
  });

  it('falls back to Error.message if response data is missing', () => {
    const error = new Error('Network timeout');
    expect(getErrorMessage(error)).toBe('Network timeout');
  });

  it('ignores raw status code strings and returns fallback', () => {
    const error = new Error('Request failed with status code 500');
    expect(getErrorMessage(error)).toBe('An unexpected error occurred.');
  });

  it('returns custom fallback when error is null or undefined', () => {
    expect(getErrorMessage(null, 'Custom fallback')).toBe('Custom fallback');
    expect(getErrorMessage(undefined, 'Custom fallback')).toBe('Custom fallback');
  });
});
