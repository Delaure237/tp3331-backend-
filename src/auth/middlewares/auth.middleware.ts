import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthError } from '../utils/error';
// ✅ Import des types depuis votre fichier auth.types.ts
import { AuthenticatedRequest, AuthenticatedUser } from '../types/auth.types';

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        // 1. Récupération du token (Cookie ou Header)
        const token = req.cookies?.authToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
            throw new AuthError('Access denied. No token provided.', 'NO_TOKEN', 401);
        }

        // 2. Vérification du token avec votre secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'votre_cle_secrete') as any;


        req.user = {
            id: decoded.userId,
            email: decoded.email,

            roleName: decoded.roleName || (Array.isArray(decoded.roles) ? decoded.roles[0] : 'User'),
            hospitalId: decoded.hospitalId || null,
            roleId: decoded.roleId || ''
        } as AuthenticatedUser;

        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AuthError('Invalid or expired token.', 'INVALID_TOKEN', 401));
        } else {
            next(error);
        }
    }
};