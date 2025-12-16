// src/auth/controllers/auth.controller.ts

import { Response, NextFunction, Request } from 'express';
import fs from 'fs';
import path from 'path';

// IMPORT MANQUANT : On importe le service pour l'utiliser dans les méthodes
import AuthService from '../services/auth.service';

import {
    LoginRequest,
    PatientSignUpRequest,
    StaffUserCreationRequest,
    ChangePasswordRequest,
    ResetPasswordRequest,
    RegisterHospitalRequest,
    AuthenticatedRequest
} from '../types/auth.types';

import { AuthError } from '../utils/error';

/**
 * Utilitaire pour le nettoyage des fichiers en cas d'erreur
 */
const cleanUpFiles = (files: any, keys: string[]): void => {
    if (!files) return;
    keys.forEach(key => {
        if (files[key] && Array.isArray(files[key])) {
            files[key].forEach((file: any) => {
                if (file.path && fs.existsSync(file.path)) {
                    fs.unlinkSync(file.path);
                }
            });
        }
    });
};

class AuthController {

    // ------------------------------------------------------------------
    // 1. Inscription (Sign Up)
    // ------------------------------------------------------------------

    async signUpPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const data = req.body as PatientSignUpRequest;

            if (!data.email || !data.password || !data.firstName || !data.lastName || !data.idNumber || !data.insurance) {
                throw new AuthError('Missing required fields for patient signup.', 'MISSING_FIELDS', 400);
            }

            const result = await AuthService.signUpPatient(data);

            res.status(201).json({
                message: 'Patient registered successfully.',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    async registerHospital(req: Request, res: Response, next: NextFunction): Promise<void> {
        const files: any = req.files || {};
        const filesToClean = ['hospitalLogo', 'hospitalImages'];

        try {
            const data = req.body as RegisterHospitalRequest;

            if (!data.hospitalName || !data.hospitalEmail || !data.password || !data.address || !data.openingHours || !data.services) {
                cleanUpFiles(files, filesToClean);
                throw new AuthError('Missing required hospital and/or admin fields.', 'MISSING_FIELDS', 400);
            }

            // Gestion du format JSON pour les services (envoyés via FormData)
            let servicesParsed: string[] = [];
            if (typeof data.services === 'string') {
                try {
                    servicesParsed = JSON.parse(data.services);
                } catch(e) {
                    cleanUpFiles(files, filesToClean);
                    throw new AuthError('Services field must be a valid JSON array string.', 'INVALID_FORMAT', 400);
                }
            } else if (Array.isArray(data.services)) {
                 servicesParsed = data.services;
            }

            const cleanData: RegisterHospitalRequest = {
                ...data,
                services: servicesParsed
            };

            const result = await AuthService.registerHospital(cleanData, files);

            res.status(201).json({
                message: 'Hospital and Admin registered successfully.',
                ...result,
            });
        } catch (error) {
            cleanUpFiles(files, filesToClean);
            next(error);
        }
    }

    // ------------------------------------------------------------------
    // 2. Connexion (Login)
    // ------------------------------------------------------------------

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, password } = req.body as LoginRequest;
            if (!email || !password) {
                throw new AuthError('Email and password are required.', 'MISSING_CREDENTIALS', 400);
            }

            const result = await AuthService.login({ email, password });

            res.status(200).json({
                message: 'Login successful.',
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    // ------------------------------------------------------------------
    // 3. Gestion Interne (Staff/Admin)
    // ------------------------------------------------------------------

    async createStaffUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const hospitalId = req.user?.hospitalId;
            const data = req.body as StaffUserCreationRequest;

            if (!hospitalId) {
                throw new AuthError('Hospital ID is required from authenticated user.', 'MISSING_HOSPITAL_ID', 403);
            }
            if (!data.email || !data.password || !data.roleName || !data.jobTitle) {
                 throw new AuthError('Missing required fields for staff creation.', 'MISSING_FIELDS', 400);
            }

            const result = await AuthService.createStaffUser(hospitalId, data);

            res.status(201).json({
                message: `User created successfully as ${data.roleName}.`,
                ...result,
            });
        } catch (error) {
            next(error);
        }
    }

    // ------------------------------------------------------------------
    // 4. Gestion de Profil et Mots de Passe
    // ------------------------------------------------------------------

    async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user.id;
            const user = await AuthService.getCurrentUser(userId);

            res.status(200).json({
                message: 'User profile retrieved.',
                user,
            });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body as ChangePasswordRequest;

            if (!currentPassword || !newPassword) {
                 throw new AuthError('Current and new passwords are required.', 'MISSING_PASSWORDS', 400);
            }

            await AuthService.changePassword(userId, currentPassword, newPassword);

            res.status(200).json({ message: 'Password changed successfully.' });
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;
            if (!email) {
                throw new AuthError('Email is required.', 'MISSING_EMAIL', 400);
            }
            await AuthService.forgotPassword(email);

            res.status(200).json({
                message: 'If the email is registered, a password reset link has been sent.'
            });
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { resetToken, newPassword } = req.body as ResetPasswordRequest;
            if (!resetToken || !newPassword) {
                throw new AuthError('Token and new password are required.', 'MISSING_FIELDS', 400);
            }

            await AuthService.resetPassword(resetToken, newPassword);

            res.status(200).json({ message: 'Password has been successfully reset.' });
        } catch (error) {
            next(error);
        }
    }
}

export default new AuthController();