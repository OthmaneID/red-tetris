// Dynamic import of pg so that unit tests can run cleanly in environments
// where pg is either mocked, unavailable, or running in local file fallback mode.

export interface QueryResult<T = unknown> {
  rows: T[];
}

export interface DbPool {
  query: (sql: string, params?: unknown[]) => Promise<QueryResult>;
  connect: () => Promise<{
    query: (sql: string, params?: unknown[]) => Promise<QueryResult>;
    release: () => void;
  }>;
}

let poolInstance: DbPool | null = null;
let isDbAvailable = false;

export async function getPool(): Promise<DbPool | null> {
  if (poolInstance) return poolInstance;

  const connectionString =
    process.env.DATABASE_URL ||
    (process.env.POSTGRES_USER && process.env.POSTGRES_DB
      ? `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD || ""}@${process.env.POSTGRES_HOST || "localhost"}:${process.env.POSTGRES_PORT || 5432}/${process.env.POSTGRES_DB}`
      : undefined);

  if (!connectionString) return null;

  try {
    const pg = await import("pg");
    const PoolConstructor = pg.default?.Pool || pg.Pool;
    if (PoolConstructor) {
      poolInstance = new PoolConstructor({
        connectionString,
        connectionTimeoutMillis: 2000,
        idleTimeoutMillis: 10000,
      }) as unknown as DbPool;
    }
  } catch {
    poolInstance = null;
  }

  return poolInstance;
}

export async function checkDatabaseConnection(): Promise<boolean> {
  const pool = await getPool();
  if (!pool) {
    isDbAvailable = false;
    return false;
  }
  try {
    const client = await pool.connect();
    try {
      await client.query("SELECT 1");
      isDbAvailable = true;
      return true;
    } finally {
      client.release();
    }
  } catch (err) {
    isDbAvailable = false;
    console.warn(
      "PostgreSQL connection check failed, using local fallback:",
      (err as Error).message
    );
    return false;
  }
}

export function isDatabaseConnected(): boolean {
  return isDbAvailable;
}
