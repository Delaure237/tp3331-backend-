// src/auth/middleware/authorize.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { AuthError } from '../utils/error';

/**
 * Middleware pour autoriser l'accès selon les rôles.
 * Utilise Request (standard) pour la compatibilité avec le routeur Express.
 */
export const authorize = (allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        // On cast en AuthenticatedRequest seulement ici pour accéder à .user
        const authReq = req as AuthenticatedRequest;
        const userRole = authReq.user?.roleName;

        if (!userRole) {
            return next(new AuthError('Authentication required.', 'UNAUTHENTICATED', 401));
        }

        if (allowedRoles.includes(userRole)) {
            next();
        } else {
            next(new AuthError('Access forbidden. Insufficient role permissions.', 'FORBIDDEN', 403));
        }
    };
};