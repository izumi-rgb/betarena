const SQLI_PATTERNS: RegExp[] = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|TRUNCATE|EXEC|EXECUTE)\b\s)/i,
  /(\bUNION\b\s+(ALL\s+)?SELECT\b)/i,
  /(--\s)/,
  /(;\s*(DROP|DELETE|UPDATE|INSERT|ALTER|CREATE|TRUNCATE))/i,
  /('\s*(OR|AND)\s+'?\d*'?\s*=\s*'?\d*)/i,
  /('\s*(OR|AND)\s+\d+\s*=\s*\d+)/i,
  /(\/\*[\s\S]*?\*\/)/,
  /(\bWAITFOR\b\s+\bDELAY\b)/i,
  /(\bBENCHMARK\b\s*\()/i,
  /(\bSLEEP\b\s*\()/i,
  /(\bLOAD_FILE\b\s*\()/i,
  /(\bINTO\s+OUTFILE\b)/i,
  /(\bINFORMATION_SCHEMA\b)/i,
  /(\bCHAR\b\s*\(\s*\d+)/i,
  /(\bCONCAT\b\s*\()/i,
  /(0x[0-9a-fA-F]+)/,
  /(\b(xp_cmdshell|sp_executesql)\b)/i,
];

export interface SqliResult {
  isSuspicious: boolean;
  matchedPattern: string | null;
  input: string;
}

export function detectSqli(input: string): SqliResult {
  for (const pattern of SQLI_PATTERNS) {
    if (pattern.test(input)) {
      return {
        isSuspicious: true,
        matchedPattern: pattern.source,
        input: input.substring(0, 200),
      };
    }
  }
  return { isSuspicious: false, matchedPattern: null, input: input.substring(0, 200) };
}

function deepScan(obj: unknown): SqliResult | null {
  if (typeof obj === 'string') {
    const result = detectSqli(obj);
    if (result.isSuspicious) return result;
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      const result = deepScan(item);
      if (result) return result;
    }
  } else if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      const result = deepScan(value);
      if (result) return result;
    }
  }
  return null;
}

export function scanRequestForSqli(body: unknown, query: unknown, params: unknown): SqliResult | null {
  return deepScan(body) || deepScan(query) || deepScan(params);
}
