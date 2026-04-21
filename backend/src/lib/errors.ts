import type { Context } from 'hono'

export interface ApiError {
  error: string
  message: string
  statusCode: number
}

export function httpError(
  c: Context,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 500,
  error: string,
  message: string,
) {
  return c.json<ApiError>({ error, message, statusCode: status }, status)
}

export const badRequest = (c: Context, message: string) =>
  httpError(c, 400, 'BadRequest', message)

export const unauthorized = (c: Context, message = 'Authentication required') =>
  httpError(c, 401, 'Unauthorized', message)

export const forbidden = (c: Context, message = 'You do not have permission to do this') =>
  httpError(c, 403, 'Forbidden', message)

export const notFound = (c: Context, message = 'Resource not found') =>
  httpError(c, 404, 'NotFound', message)

export const conflict = (c: Context, message: string) =>
  httpError(c, 409, 'Conflict', message)

export const unprocessable = (c: Context, message: string) =>
  httpError(c, 422, 'ValidationError', message)

export const serverError = (c: Context, message = 'An unexpected error occurred') =>
  httpError(c, 500, 'InternalServerError', message)
