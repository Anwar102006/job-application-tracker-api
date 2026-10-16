import '@testing-library/jest-dom';
import React from 'react';
import { vi } from 'vitest';

// Polyfill ResizeObserver for JSDOM environments
if (typeof window !== 'undefined' && !window.ResizeObserver) {
  window.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

// Mock Recharts ResponsiveContainer for JSDOM so tests render children without width=0 warnings
vi.mock('recharts', async (importOriginal) => {
  const original = await importOriginal();
  return {
    ...original,
    ResponsiveContainer: ({ children, width = 500, height = 300 }) =>
      React.createElement(
        'div',
        {
          style: {
            width: typeof width === 'number' ? width : 500,
            height: typeof height === 'number' ? height : 300,
          },
          className: 'recharts-responsive-container',
        },
        children
      ),
  };
});
