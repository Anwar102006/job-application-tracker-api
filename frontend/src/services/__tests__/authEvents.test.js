import { describe, it, expect, vi, beforeEach } from 'vitest';
import { emitSessionExpired, onSessionExpired, clearAuthEventListeners } from '../authEvents';

describe('authEvents (Authentication Event Bus)', () => {
  beforeEach(() => {
    clearAuthEventListeners();
  });

  it('notifies subscribers when emitSessionExpired is called', () => {
    const subscriber = vi.fn();
    onSessionExpired(subscriber);

    emitSessionExpired();
    expect(subscriber).toHaveBeenCalledTimes(1);
  });

  it('allows subscribers to unsubscribe via returned function', () => {
    const subscriber = vi.fn();
    const unsubscribe = onSessionExpired(subscriber);

    emitSessionExpired();
    expect(subscriber).toHaveBeenCalledTimes(1);

    unsubscribe();
    emitSessionExpired();
    expect(subscriber).toHaveBeenCalledTimes(1); // Not called again
  });

  it('supports multiple independent subscribers', () => {
    const sub1 = vi.fn();
    const sub2 = vi.fn();

    onSessionExpired(sub1);
    const unsub2 = onSessionExpired(sub2);

    emitSessionExpired();
    expect(sub1).toHaveBeenCalledTimes(1);
    expect(sub2).toHaveBeenCalledTimes(1);

    unsub2();
    emitSessionExpired();
    expect(sub1).toHaveBeenCalledTimes(2);
    expect(sub2).toHaveBeenCalledTimes(1);
  });

  it('isolates listener errors so other listeners still receive notifications', () => {
    const faultySub = vi.fn(() => {
      throw new Error('Listener crashed');
    });
    const healthySub = vi.fn();

    onSessionExpired(faultySub);
    onSessionExpired(healthySub);

    expect(() => emitSessionExpired()).not.toThrow();
    expect(faultySub).toHaveBeenCalledTimes(1);
    expect(healthySub).toHaveBeenCalledTimes(1);
  });

  it('safely handles non-function subscribers', () => {
    expect(() => onSessionExpired(null)).not.toThrow();
    expect(() => onSessionExpired(undefined)).not.toThrow();
    expect(() => emitSessionExpired()).not.toThrow();
  });
});
