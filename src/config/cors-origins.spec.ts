import { describe, expect, it } from '@jest/globals';

import { isAllowedCorsOrigin, normalizeCorsOrigins, validateCorsOrigins } from './cors-origins';

describe('cors origins', () => {
  it('normalizes comma separated origins', () => {
    expect(normalizeCorsOrigins(' https://a.example.com , , https://b.example.com ')).toEqual([
      'https://a.example.com',
      'https://b.example.com'
    ]);
  });

  it('matches exact origins', () => {
    expect(isAllowedCorsOrigin('https://app.victriumtech.com', ['https://app.victriumtech.com'])).toBe(true);
    expect(isAllowedCorsOrigin('https://app.victriumtech.com', ['https://admin.victriumtech.com'])).toBe(false);
  });

  it('matches wildcard subdomains but not the root domain', () => {
    expect(isAllowedCorsOrigin('https://app.victriumtech.com', ['https://*.victriumtech.com'])).toBe(true);
    expect(isAllowedCorsOrigin('https://admin.eu.victriumtech.com', ['https://*.victriumtech.com'])).toBe(true);
    expect(isAllowedCorsOrigin('https://victriumtech.com', ['https://*.victriumtech.com'])).toBe(false);
  });

  it('rejects invalid production origins', () => {
    expect(() => validateCorsOrigins(['*'], 'production')).toThrow('Invalid CORS origin: *');
    expect(() => validateCorsOrigins(['https://localhost:3000'], 'production')).toThrow(
      'Unsafe CORS origin in production: https://localhost:3000'
    );
    expect(() => validateCorsOrigins(['https://*.localhost'], 'production')).toThrow(
      'Unsafe CORS origin in production: https://*.localhost'
    );
  });
});
