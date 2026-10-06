import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

/**
 * Neon's HTTP driver sends each query as one fetch. A dropped connection
 * ("fetch failed") would otherwise surface as a page error, so read-only
 * queries are retried a couple of times. Writes are never retried: the first
 * attempt may have reached the database before the connection dropped.
 */
const READ_ONLY = /^\s*(select|with)\b/i;

function isReadOnly(body: unknown) {
  if (typeof body !== 'string') return false;
  try {
    const payload = JSON.parse(body) as { query?: string; queries?: { query?: string }[] };
    const queries = payload.queries ? payload.queries.map(item => item.query ?? '') : [payload.query ?? ''];
    return queries.every(query => READ_ONLY.test(query) && !/\b(insert|update|delete)\b/i.test(query));
  } catch {
    return false;
  }
}

neonConfig.fetchFunction = async (input: RequestInfo | URL, init?: RequestInit) => {
  const attempts = isReadOnly(init?.body) ? 3 : 1;
  for (let attempt = 1; ; attempt++) {
    try {
      return await fetch(input, init);
    } catch (error) {
      if (attempt >= attempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 150 * attempt));
    }
  }
};

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
