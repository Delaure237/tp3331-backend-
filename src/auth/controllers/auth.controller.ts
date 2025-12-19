import { Response, NextFunction, Request } from 'express';
import fs from 'fs';
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

const setAuthCookie = (res: Response, token: string) => {
    res.cookie('authToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/'
    });
};

class AuthController {

    // --- Inscriptions (Pas de cookie ici, attend l'OTP) ---

// Modifiez temporairement cette partie dans votre contrôleur
async signUpPatient(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const data = req.body as PatientSignUpRequest;
        console.log("Données reçues du front:", data); // LOG 1
        const result = await AuthService.signUpPatient(data);
        res.status(201).json({
            success: true,
            message: 'Registration initiated. Please verify your email.',
            email: result.email,
            expiresAt: result.expiresAt
        });
    } catch (error) {
        console.error("ERREUR CRITIQUE SIGNUP:", error); // LOG 2 : C'est ici que vous verrez le vrai problème
        next(error);
    }
}

async registerHospital(req: Request, res: Response, next: NextFunction): Promise<void> {
        const files: any = req.files || {};
        try {
            const data = req.body as RegisterHospitalRequest;

            // LOGS DE DEBUG
            console.log(" [REGISTER HOSPITAL] Body reçu:", data);
            console.log(" [REGISTER HOSPITAL] Fichiers reçus:", Object.keys(files));

            let servicesParsed = data.services;
            if (typeof data.services === 'string') {
                try {
                    servicesParsed = JSON.parse(data.services);
                } catch (e) {
                    console.error(" [ERROR PARSING SERVICES]:", data.services);
                    throw new AuthError('Invalid format for services JSON.', 'INVALID_SERVICES', 400);
                }
            }

            const result = await AuthService.registerHospital({ ...data, services: servicesParsed }, files);

            res.status(201).json({
                success: true,
                message: 'Hospital registered. OTP sent to email.',
                email: result.email,
                expiresAt: result.expiresAt
            });
        } catch (error) {
            console.error(" [ERREUR CRITIQUE REGISTER HOSPITAL]:", error); // TRÈS IMPORTANT
            cleanUpFiles(files, ['hospitalLogo', 'hospitalImages']);
            next(error);

    }
}
    // --- Validation OTP ---

    async verifyOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, otp } = req.body;
            if (!email || !otp) throw new AuthError('Email and OTP are required.', 'MISSING_FIELDS', 400);

            const result = await AuthService.verifyOtp(email, otp);

            // On pose le cookie UNIQUEMENT après validation
            setAuthCookie(res, result.token);

            res.status(200).json({
                success: true,
                message: 'Account verified and logged in.',
                user: result.user
            });
        } catch (error) { next(error); }
    }

    // --- Session ---

    async login(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const result = await AuthService.login(req.body as LoginRequest);
            setAuthCookie(res, result.token);
            res.status(200).json({
                success: true,
                message: 'Login successful.',
                user: result.user
            });
        } catch (error) { next(error); }
    }

    async logout(req: Request, res: Response): Promise<void> {
        res.clearCookie('authToken', { path: '/' });
        res.status(200).json({ success: true, message: 'Logged out successfully.' });
    }

    // --- Mots de passe (Utilisation de l'OTP) ---

    async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email } = req.body;
            if (!email) throw new AuthError('Email is required.', 'MISSING_EMAIL', 400);

            await AuthService.forgotPassword(email);
            res.status(200).json({
                success: true,
                message: 'If the email exists, a reset code has been sent.'
            });
        } catch (error) { next(error); }
    }

    async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { email, otp, newPassword } = req.body; // Adapté au service
            if (!email || !otp || !newPassword) {
                throw new AuthError('Email, OTP and new password are required.', 'MISSING_FIELDS', 400);
            }
            await AuthService.resetPassword({ email, otp, newPassword });
            res.status(200).json({ success: true, message: 'Password reset successful.' });
        } catch (error) { next(error); }
    }

    // --- Autres ---

    async getCurrentUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const userId = req.user?.id;
            if (!userId) throw new AuthError('Unauthorized', 'UNAUTHORIZED', 401);
            const user = await AuthService.getCurrentUser(userId);
            res.status(200).json({ success: true, user });
        } catch (error) { next(error); }
    }


    // --- Gestion du Staff (Hôpitaux) ---

    /**
     * Permet à un Admin d'hôpital de créer un compte pour un membre du staff
     * (Docteurs, Réceptionnistes, etc.)
     */
    async createStaffUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            // On récupère l'hospitalId de l'admin connecté (via le middleware authenticate)
            const hospitalId = req.user?.hospitalId;

            if (!hospitalId) {
                throw new AuthError(
                    'Action interdite : vous n\'êtes rattaché à aucun hôpital.',
                    'HOSPITAL_ID_REQUIRED',
                    403
                );
            }

            const data = req.body as StaffUserCreationRequest;

            // Appel au service pour créer le membre du staff
            const result = await AuthService.createStaffUser(hospitalId, data);

            res.status(201).json({
                success: true,
                message: 'Membre du personnel créé avec succès.',
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;

        if (!userId) throw new AuthError('Non autorisé.', 'UNAUTHORIZED', 401);

        await AuthService.changePassword(userId, currentPassword, newPassword);

        res.status(200).json({
            success: true,
            message: 'Mot de passe modifié avec succès.'
        });
    } catch (error) {
        next(error);
    }
}
}

export default new AuthController();