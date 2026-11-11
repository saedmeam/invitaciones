import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { AuthTokenPayload } from '../../application/use-cases/AuthUseCases';
import { AppError } from '../../shared/errors/AppError';

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export function createAuthMiddleware(jwtSecret: string) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new AppError('Token de autenticación requerido', 401, 'UNAUTHORIZED'));
    }

    const token = authHeader.slice(7).trim();
    try {
      const decoded = jwt.verify(token, jwtSecret) as AuthTokenPayload;
      req.user = decoded;
      return next();
    } catch {
      return next(new AppError('Token inválido o expirado', 401, 'INVALID_TOKEN'));
    }
  };
}
