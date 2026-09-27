// Environment — single home for reading required variables

/**
 * Fails fast when a required variable is missing, instead of letting a client
 * build a request against `undefined` and fail pages later with an opaque error.
 *
 * @param name - The environment variable to read
 * @returns Its value, guaranteed non-empty
 * @throws {Error} If the variable is missing or blank
 */
export function requiredEnv(name: string): string {
  const value = process.env[name];

  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${name} is not set — the application cannot start without it`);
  }

  return value;
}
