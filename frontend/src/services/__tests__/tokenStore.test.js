/* global localStorage, sessionStorage */
import { describe, it, expect, beforeEach } from 'vitest';
import { getAccessToken, setAccessToken, clearAccessToken } from '../tokenStore';

describe('tokenStore (In-Memory Access Token Storage)', () => {
  beforeEach(() => {
    clearAccessToken();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('initially returns null when no token has been set', () => {
    expect(getAccessToken()).toBeNull();
  });

  it('sets and retrieves an in-memory access token correctly', () => {
    const mockJwt = 'mock.jwt.access-token';
    setAccessToken(mockJwt);
    expect(getAccessToken()).toBe(mockJwt);
  });

  it('clears access token back to null on clearAccessToken()', () => {
    setAccessToken('mock.jwt.token');
    expect(getAccessToken()).toBe('mock.jwt.token');

    clearAccessToken();
    expect(getAccessToken()).toBeNull();
  });

  it('does NOT write or leak access token to localStorage or sessionStorage', () => {
    const sensitiveJwt = 'secret.jwt.value';
    setAccessToken(sensitiveJwt);

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(sessionStorage.getItem('accessToken')).toBeNull();
    expect(sessionStorage.getItem('token')).toBeNull();
  });

  it('handles null, undefined, or empty values safely', () => {
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();

    setAccessToken(undefined);
    expect(getAccessToken()).toBeNull();

    setAccessToken('');
    expect(getAccessToken()).toBeNull();
  });
});
