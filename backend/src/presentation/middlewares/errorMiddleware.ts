import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../shared/errors/AppError';

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      code: 'VALIDATION_ERROR',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
  }

  console.error('Unhandled error:', err);
  return res.status(500).json({
    error: 'Error interno del servidor',
    code: 'INTERNAL_ERROR',
  });
}
