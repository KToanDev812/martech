import { Query } from 'express';

/**
 * Utility functions for handling Express request types safely
 */

/**
 * Extract a string value from Express params or query that can be string | string[] | ParsedQs
 * @param value - The value from req.params or req.query
 * @returns The string value or undefined if not present or not a string
 */
export function getStringParam(value: string | string[] | Query | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }
  return typeof value === 'string' ? value : undefined;
}

/**
 * Extract a string value from Express params or query, throwing if not present
 * @param value - The value from req.params or req.query
 * @param paramName - The name of the parameter (for error messages)
 * @returns The string value
 * @throws Error if the parameter is not present or not a string
 */
export function requireStringParam(value: string | string[] | Query | undefined, paramName: string): string {
  const result = getStringParam(value);
  if (!result) {
    throw new Error(`Required parameter '${paramName}' is missing`);
  }
  return result;
}
