// src/auth/middlewares/auth.middleware.ts

import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../types/auth.types';
import { models } from '../../models';
import { AuthError } from '../utils/error';

const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_par_defaut';

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (!token) {
            throw new AuthError('Access denied. No token provided.', 'NO_TOKEN', 401);
        }

        // 1. Décoder le token (on utilise le type 'any' temporairement pour extraire l'ID)
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // Note: Dans votre JWT, vous stockez 'userId'. Vérifiez que cela correspond à decoded.userId
        const userId = decoded.userId || decoded.id;

        // 2. Vérifier l'utilisateur en DB
        const user = await models.User.findOne({
            where: { id: userId },
            include: [{ model: models.Role, as: 'role' }]
        });

        if (!user) {
             throw new AuthError('User not found.', 'USER_NOT_FOUND', 401);
        }

        const userRole = (user as any).role;

        // 3. Injecter les données dans req.user
        // On utilise 'name' ou 'roleName' selon votre modèle Role
        req.user = {
            id: user.id,
            email: user.email,
            roleName: userRole?.name || userRole?.roleName || 'User',
            hospitalId: user.hospitalId,
            roleId: userRole?.id,
        };

        next();

    } catch (error: any) {
        if (error instanceof AuthError) {
            next(error);
        } else if (error.name === 'JsonWebTokenError') {
            next(new AuthError('Invalid token.', 'INVALID_TOKEN', 401));
        } else if (error.name === 'TokenExpiredError') {
            next(new AuthError('Token expired.', 'TOKEN_EXPIRED', 401));
        } else {
            next(new AuthError('Authentication failed.', 'AUTH_FAILED', 500, error));
        }
    }
};