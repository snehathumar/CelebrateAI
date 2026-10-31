import { Request, Response, NextFunction } from 'express';

/**
 * Global Centralized Error Handling Middleware
 * Shields client from internal stack traces, system paths, or credential details.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): Response {
  console.error('Server Internal Error (Server-Side Diagnostic):', err);

  const errorObj = err as { type?: string; status?: number; statusCode?: number };

  if (errorObj?.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      error: 'Payload Too Large: Maximum allowed request body size is 100KB.',
    });
  }

  const statusCode = errorObj?.statusCode || errorObj?.status || 500;
  return res.status(statusCode).json({
    success: false,
    error:
      statusCode === 400
        ? 'Bad Request: Malformed JSON payload or invalid parameters.'
        : 'An unexpected internal server error occurred.',
  });
}
