// src/auth/services/auth.service.ts

import { sequelize, models } from '../../models';
import { Op } from 'sequelize';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// Import des types locaux (Assurez-vous que auth.types.ts contient bien toutes ces interfaces)
import {
    LoginRequest,
    PatientSignUpRequest,
    StaffUserCreationRequest,
    AuthResponse,
    HospitalAuthResponse,
    AuthTokenPayload,
    RegisterHospitalRequest
} from '../types/auth.types';

import { AuthError } from '../utils/error';
import { generateJwtToken } from '../utils/jwt';
import logger from '../../../utils/logger';


class AuthService {

    // --- Méthodes Utilitaires ---

    /**
     * Nettoie les fichiers uploadés en cas d'erreur ou de validation échouée.
     */
    private cleanUpFiles(files: any, keys: string[]): void {
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
    }

    /**
     * @description Enregistre un nouvel Hôpital et crée l'administrateur principal.
     */
    async registerHospital(data: RegisterHospitalRequest, files: any): Promise<HospitalAuthResponse> {
        const {
            hospitalName, hospitalEmail, phoneNumber1, phoneNumber2, address,
            openingHours, services,
            password, adminFirstName, adminLastName, adminPhone
        } = data;

        const filesToClean = ['hospitalLogo', 'hospitalImages'];

        if (password.length < 8) {
            this.cleanUpFiles(files, filesToClean);
            throw new AuthError('Password must be at least 8 characters long.', 'WEAK_PASSWORD');
        }

        const t = await sequelize.transaction();

        try {
            const hospitalLogoPath = files?.hospitalLogo ? files.hospitalLogo[0].path : null;
            const hospitalPhotosPaths = files?.hospitalImages ? files.hospitalImages.map((file: any) => file.path) : null;

            const existingUser = await models.User.findOne({ where: { email: hospitalEmail } });
            if (existingUser) throw new AuthError('Email already in use.', 'EMAIL_IN_USE', 409);

            // Recherche ou création du rôle Admin
            let adminRole = await models.Role.findOne({
                where: { name: 'Hospital Admin' } as any,
                transaction: t
            });

            if (!adminRole) {
                adminRole = await models.Role.create({
                    name: 'Hospital Admin',
                    description: 'Administrateur principal de l\'hôpital.'
                } as any, { transaction: t });
            }

            // Création de l'hôpital
            const hospital = await models.Hospital.create({
                hospitalName,
                hospitalEmail,
                phoneNumber1,
                phoneNumber2: phoneNumber2 || null,
                address,
                openingHours,
                services,
                hospitalLogo: hospitalLogoPath,
                hospitalImages: hospitalPhotosPaths,
            }, { transaction: t });

            const passwordHash = await bcrypt.hash(password, 10);

            // Création de l'utilisateur rattaché
            const user = await models.User.create({
                email: hospitalEmail,
                password: passwordHash,
                roleId: adminRole.id,
                hospitalId: hospital.id,
                firstName: adminFirstName,
                lastName: adminLastName,
                phoneNumber: adminPhone
            } as any, { transaction: t });

            // Génération du Token avec tableau 'roles'
            const token = generateJwtToken({
                userId: user.id,
                email: user.email,
                hospitalId: hospital.id,
                roles: [(adminRole as any).name]
            });

            await t.commit();

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    roleName: (adminRole as any).name,
                    hospitalId: hospital.id,
                },
                hospital: hospital.get({ clone: true })
            };
        } catch (error: any) {
            await t.rollback();
            this.cleanUpFiles(files, filesToClean);
            if (error instanceof AuthError) throw error;
            throw new AuthError('Failed to register hospital.', 'HOSPITAL_REGISTRATION_FAILED', 500, error);
        }
    }

    /**
     * @description Enregistre un nouveau Patient.
     */
    async signUpPatient(data: PatientSignUpRequest): Promise<AuthResponse> {
        const { email, password, firstName, lastName, idNumber, insurance } = data;
        const t = await sequelize.transaction();
        try {
            const existingUser = await models.User.findOne({ where: { email } });
            if (existingUser) throw new AuthError('Email already in use.', 'EMAIL_IN_USE', 409);

            let patientRole = await models.Role.findOne({ where: { name: 'Patient' } as any, transaction: t });
            if (!patientRole) {
                patientRole = await models.Role.create({
                    name: 'Patient',
                    description: 'Accès portail patient.'
                } as any, { transaction: t });
            }

            const passwordHash = await bcrypt.hash(password, 10);

            const user = await models.User.create({
                email,
                password: passwordHash,
                roleId: patientRole.id,
                hospitalId: null,
            } as any, { transaction: t });

            await models.Patient.create({
                userId: user.id,
                firstName,
                lastName,
                idNumber,
                insurance,
                status: 'New Patient',
            } as any, { transaction: t });

            const token = generateJwtToken({
                userId: user.id,
                email: user.email,
                hospitalId: null,
                roles: [(patientRole as any).name]
            });

            await t.commit();

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    roleName: (patientRole as any).name,
                    hospitalId: null,
                }
            };
        } catch (error: any) {
            await t.rollback();
            if (error instanceof AuthError) throw error;
            throw new AuthError('Failed to register patient.', 'REGISTRATION_FAILED', 500, error);
        }
    }

    /**
     * @description Connexion utilisateur.
     */
    async login(data: LoginRequest): Promise<AuthResponse> {
        const { email, password } = data;

        const user = await models.User.findOne({
            where: { email },
            include: [{ model: models.Role, as: 'role' }]
        });

        if (!user) throw new AuthError('Invalid credentials.', 'INVALID_CREDENTIALS', 401);

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) throw new AuthError('Invalid credentials.', 'INVALID_CREDENTIALS', 401);

        const roleName = (user as any).role?.name || 'User';

        const token = generateJwtToken({
            userId: user.id,
            email: user.email,
            hospitalId: user.hospitalId,
            roles: [roleName]
        });

        return {
            token,
            user: {
                id: user.id,
                email: user.email,
                roleName: roleName,
                hospitalId: user.hospitalId,
            }
        };
    }

    /**
     * @description Récupère le profil de l'utilisateur connecté.
     */
    async getCurrentUser(userId: string): Promise<any> {
        const user = await models.User.findOne({
            where: { id: userId },
            include: [
                { model: models.Role, as: 'role' },
                { model: models.Doctor, as: 'doctorProfile' },
                { model: models.Patient, as: 'patientProfile' },
            ]
        });

        if (!user) throw new AuthError('User not found.', 'USER_NOT_FOUND', 404);

        return {
            id: user.id,
            email: user.email,
            roleName: (user as any).role?.name || 'Unassigned',
            hospitalId: user.hospitalId,
            profile: (user as any).doctorProfile || (user as any).patientProfile || null,
        };
    }

    /**
     * @description Crée un utilisateur Staff (Docteur, etc.) pour un hôpital.
     */
    async createStaffUser(hospitalId: string, data: StaffUserCreationRequest): Promise<AuthResponse> {
        const { email, password, firstName, lastName, roleName, jobTitle } = data;
        const t = await sequelize.transaction();

        try {
            const staffRole = await models.Role.findOne({ where: { name: roleName } as any, transaction: t });
            if (!staffRole) throw new AuthError(`Role ${roleName} not found.`, 'ROLE_NOT_FOUND', 404);

            const passwordHash = await bcrypt.hash(password, 10);

            const user = await models.User.create({
                email,
                password: passwordHash,
                roleId: staffRole.id,
                hospitalId,
                firstName,
                lastName
            } as any, { transaction: t });

            if (roleName === 'Doctor') {
                await models.Doctor.create({
                    userId: user.id,
                    hospitalId,
                    firstName,
                    lastName,
                    specialty: jobTitle,
                } as any, { transaction: t });
            }

            const token = generateJwtToken({
                userId: user.id,
                email: user.email,
                hospitalId: user.hospitalId,
                roles: [(staffRole as any).name]
            });

            await t.commit();

            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    roleName: (staffRole as any).name,
                    hospitalId: user.hospitalId,
                }
            };
        } catch (error: any) {
            await t.rollback();
            if (error instanceof AuthError) throw error;
            throw new AuthError('Failed to create staff user.', 'STAFF_CREATION_FAILED', 500, error);
        }
    }

    // --- Gestion des Mots de Passe ---

    async forgotPassword(email: string): Promise<void> {
        const user = await models.User.findOne({ where: { email } });
        if (!user) return; // Sécurité : on ne confirme pas si l'email existe

        const resetToken = crypto.randomBytes(32).toString('hex');
        logger.info(`Password reset requested for ${email}. Token: ${resetToken}`);
    }

    async resetPassword(userId: string, newPassword: string): Promise<void> {
        const user = await models.User.findByPk(userId);
        if (!user) throw new AuthError('User not found.', 'USER_NOT_FOUND', 404);

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await user.update({ password: passwordHash });
    }

    async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
        const user = await models.User.findByPk(userId);
        if (!user) throw new AuthError('User not found.', 'USER_NOT_FOUND', 404);

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) throw new AuthError('Incorrect current password.', 'INCORRECT_PASSWORD', 401);

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await user.update({ password: passwordHash });
    }
}

export default new AuthService();