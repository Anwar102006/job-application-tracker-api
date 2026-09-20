import { ApiError } from '../utils/ApiError.js';

const PROHIBITED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const containsProhibitedKey = (obj, depth = 0) => {
  if (depth > 20 || !obj || typeof obj !== 'object') {
    return false;
  }

  // Check prototype pollution on root object
  if (depth === 0 && !Array.isArray(obj)) {
    const proto = Object.getPrototypeOf(obj);
    if (proto !== Object.prototype && proto !== null) {
      return true;
    }
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (containsProhibitedKey(item, depth + 1)) {
        return true;
      }
    }
    return false;
  }

  for (const key of Object.keys(obj)) {
    if (
      PROHIBITED_KEYS.has(key) ||
      key.startsWith('$') ||
      key.includes('.')
    ) {
      return true;
    }

    if (containsProhibitedKey(obj[key], depth + 1)) {
      return true;
    }
  }

  return false;
};

export const mongoSanitize = (req, res, next) => {
  try {
    if (
      containsProhibitedKey(req.body) ||
      containsProhibitedKey(req.query) ||
      containsProhibitedKey(req.params)
    ) {
      return next(
        new ApiError(
          400,
          "Prohibited key in request: keys starting with '$' or containing '.' are forbidden"
        )
      );
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

export default mongoSanitize;
