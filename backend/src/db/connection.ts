import { Pool, PoolClient } from 'pg';
import { logger } from '@utils/logger';

// Database connection pool
let pool: Pool | null = null;

/**
 * Initialize database connection pool
 */
export async function initDatabase(): Promise<void> {
  try {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      min: parseInt(process.env.DATABASE_POOL_MIN || '2', 10),
      max: parseInt(process.env.DATABASE_POOL_MAX || '10', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info('Database connected successfully');
    logger.debug('Database time:', result.rows[0].now);
    client.release();
  } catch (error) {
    logger.error('Failed to initialize database:', error);
    throw error;
  }
}

/**
 * Get database connection pool
 */
export function getPool(): Pool {
  if (!pool) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return pool;
}

/**
 * Sanitize query for logging (remove sensitive data)
 */
function sanitizeQuery(text: string): string {
  return text
    .replace(/password_hash\s*=\s*\$1/gi, 'password_hash = ***')
    .replace(/password\s*=\s*\$1/gi, 'password = ***')
    .substring(0, 100); // Truncate for security
}

/**
 * Enhanced security logging for queries
 */
function logQueryExecution(query: string, params: any[] | undefined, duration: number, rowCount: number, error?: any): void {
  const logData = {
    duration: `${duration}ms`,
    rows: rowCount,
    params: params?.length || 0, // Don't log actual parameter values for security
    queryPreview: sanitizeQuery(query),
    hasError: !!error,
  };

  if (error) {
    logger.error('Database query error', {
      ...logData,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  } else {
    // Log slow queries (>1s) as warnings
    if (duration > 1000) {
      logger.warn('Slow database query', logData);
    } else {
      logger.debug('Database query executed', logData);
    }
  }
}

/**
 * Execute a query with enhanced security monitoring
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const start = Date.now();
  try {
    const pool = getPool();
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    logQueryExecution(text, params, duration, result.rowCount || 0);

    return result.rows;
  } catch (error) {
    logQueryExecution(text, params, Date.now() - start, 0, error);
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

/**
 * Close database connection pool
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
}

/**
 * Execute a callback within a database transaction with security monitoring
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();
  const startTime = Date.now();

  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');

    const result = await callback(client);

    await client.query('COMMIT');
    logger.debug('Transaction committed', {
      duration: `${Date.now() - startTime}ms`,
    });

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction failed, rolled back', {
      duration: `${Date.now() - startTime}ms`,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  } finally {
    client.release();
  }
}
