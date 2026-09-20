/** Small helpers so route files stay short and readable. */

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export const badRequest = (message, details) => new HttpError(400, message, details);
export const notFound = (message = 'Resource not found') => new HttpError(404, message);

/** Wraps async route handlers so thrown errors reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** throws 400 when a required field is missing/empty */
export function requireFields(body, fields) {
  const missing = fields.filter(
    (f) => body?.[f] === undefined || body[f] === null || String(body[f]).trim() === ''
  );
  if (missing.length) {
    throw badRequest(`Missing required field(s): ${missing.join(', ')}`, { missing });
  }
}

export function toInt(value, field = 'value') {
  const n = Number(value);
  if (!Number.isInteger(n)) throw badRequest(`${field} must be an integer`);
  return n;
}
