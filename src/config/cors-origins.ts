type CorsOriginPattern =
  | {
      type: 'exact';
      value: string;
    }
  | {
      type: 'wildcard';
      scheme: 'http' | 'https';
      hostnameSuffix: string;
      port?: string;
    };

const CORS_ORIGIN_PATTERN = /^(https?):\/\/(\*\.)?([A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+)(?::(\d+))?$/;

export function normalizeCorsOrigins(value: string) {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function parseCorsOriginPattern(value: string): CorsOriginPattern | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed === '*') {
    return null;
  }

  const wildcardMatch = trimmed.match(CORS_ORIGIN_PATTERN);
  if (wildcardMatch) {
    const [, scheme, wildcardPrefix, hostnameSuffix, port] = wildcardMatch;
    if (wildcardPrefix) {
      return {
        type: 'wildcard',
        scheme: scheme as 'http' | 'https',
        hostnameSuffix,
        port
      };
    }
  }

  try {
    const url = new URL(trimmed);
    if (url.pathname !== '/' || url.search || url.hash) {
      return null;
    }

    return {
      type: 'exact',
      value: url.origin
    };
  } catch {
    return null;
  }
}

export function isAllowedCorsOrigin(origin: string, allowedOrigins: string[]) {
  const parsedOrigin = parseCorsOriginPattern(origin);
  if (!parsedOrigin || parsedOrigin.type !== 'exact') {
    return false;
  }

  const candidate = new URL(parsedOrigin.value);

  for (const rawAllowedOrigin of allowedOrigins) {
    const allowedOrigin = parseCorsOriginPattern(rawAllowedOrigin);
    if (!allowedOrigin) {
      continue;
    }

    if (allowedOrigin.type === 'exact') {
      if (allowedOrigin.value === candidate.origin) {
        return true;
      }
      continue;
    }

    if (allowedOrigin.scheme !== candidate.protocol.replace(':', '')) {
      continue;
    }

    if (allowedOrigin.port && allowedOrigin.port !== candidate.port) {
      continue;
    }

    if (candidate.hostname === allowedOrigin.hostnameSuffix) {
      continue;
    }

    if (candidate.hostname.endsWith(`.${allowedOrigin.hostnameSuffix}`)) {
      return true;
    }
  }

  return false;
}

export function validateCorsOrigins(origins: string[], nodeEnv: 'development' | 'test' | 'production') {
  if (!origins.length) {
    throw new Error('CORS_ORIGINS must contain at least one allowed origin');
  }

  for (const origin of origins) {
    const parsed = parseCorsOriginPattern(origin);
    if (!parsed) {
      throw new Error(`Invalid CORS origin: ${origin}`);
    }

    if (nodeEnv === 'production') {
      const normalizedOrigin = parsed.type === 'exact' ? parsed.value : `${parsed.scheme}://*.${parsed.hostnameSuffix}${parsed.port ? `:${parsed.port}` : ''}`;
      if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
        throw new Error(`Unsafe CORS origin in production: ${normalizedOrigin}`);
      }
    }
  }
}
