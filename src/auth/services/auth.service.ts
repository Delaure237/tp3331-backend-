import { sequelize, models } from '../../models';
import bcrypt from 'bcryptjs';
import { generateJwtToken } from '../utils/jwt';
import { AuthError } from '../utils/error';
import {
    LoginRequest,
    PatientSignUpRequest,
    RegisterHospitalRequest,
    StaffUserCreationRequest
} from '../types/auth.types';
import { sendOtpEmail } from '../../utils/mailler';


class AuthService {
    private generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // --- 1. Inscription Hôpital ---
    // --- 1. Inscription Hôpital ---
async registerHospital(data: RegisterHospitalRequest, files: any) {
    const t = await sequelize.transaction();
    try {
        const otp = this.generateOTP();
        const expires = new Date(Date.now() + 30 * 60 * 1000);

        // Correction : On assure une valeur par défaut pour openingHours
        const hospital = await models.Hospital.create({
            hospitalName: data.hospitalName,
            hospitalEmail: data.hospitalEmail,
            phoneNumber1: data.phoneNumber1,
            phoneNumber2: data.phoneNumber2 || null,
            address: data.address,
            openingHours: data.openingHours || "24/7", // <-- PRAGMATIQUE : Valeur par défaut
            services: data.services,
            hospitalLogo: files?.hospitalLogo ? files.hospitalLogo[0].path : null,
            hospitalImages: files?.hospitalImages ? files.hospitalImages.map((f: any) => f.path) : null,
        }, { transaction: t });

        // On cherche le rôle Hospital Admin de manière insensible à la casse ou via votre mapping
        const adminRole = await models.Role.findOne({
            where: { name: 'Hospital Admin' },
            transaction: t
        });

        if (!adminRole) throw new AuthError('Rôle Hospital Admin introuvable.', 'ROLE_NOT_FOUND', 500);

        const passwordHash = await bcrypt.hash(data.password, 10);

        await models.User.create({
            email: data.hospitalEmail,
            password: passwordHash,
            roleId: adminRole.id,
            hospitalId: hospital.id,
            otpCode: otp,
            otpExpiresAt: expires,
            isActive: false
        } as any, { transaction: t });

        await sendOtpEmail(data.hospitalEmail, otp, 'VERIFICATION');
        await t.commit();
        return { email: data.hospitalEmail, expiresAt: expires };
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

    // --- 2. Inscription Patient ---
    async signUpPatient(data: PatientSignUpRequest) {
        const t = await sequelize.transaction();
        try {
            const otp = this.generateOTP();
            const expires = new Date(Date.now() + 30 * 60 * 1000);

            const patientRole = await models.Role.findOne({ where: { name: 'Patient' }, transaction: t });
            const passwordHash = await bcrypt.hash(data.password, 10);

            const user = await models.User.create({
                email: data.email,
                password: passwordHash,
                roleId: patientRole!.id,
                otpCode: otp,
                otpExpiresAt: expires,
                isActive: false
            } as any, { transaction: t });

            await models.Patient.create({
                userId: user.id,
                firstName: data.firstName,
                lastName: data.lastName,
                idNumber: data.idNumber,
                sex: data.sex || 'N/A',
                status: 'New Patient'
            } as any, { transaction: t });

            await sendOtpEmail(data.email, otp, 'VERIFICATION');
            await t.commit();
            return { email: data.email, expiresAt: expires };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    // --- 3. Création Staff (Docteur/Réceptionniste) ---
    async createStaffUser(hospitalId: string, data: StaffUserCreationRequest) {
        const t = await sequelize.transaction();
        try {
            const role = await models.Role.findOne({ where: { name: data.roleName }, transaction: t });
            if (!role) throw new AuthError('Rôle spécifié introuvable.', 'ROLE_NOT_FOUND', 400);

            const passwordHash = await bcrypt.hash(data.password, 10);

            const user = await models.User.create({
                email: data.email,
                password: passwordHash,
                roleId: role.id,
                hospitalId: hospitalId,
                isActive: true // Créé par l'admin, donc actif par défaut
            } as any, { transaction: t });

            // Si c'est un docteur, on peut aussi créer une entrée dans la table Doctor ici si elle existe

            await t.commit();
            return { id: user.id, email: user.email, role: data.roleName };
        } catch (error) {
            await t.rollback();
            throw error;
        }
    }

    // --- 4. Changement de mot de passe (Profil) ---
    async changePassword(userId: string, currentPass: string, newPass: string) {
        const user = await models.User.findByPk(userId);
        if (!user) throw new AuthError('Utilisateur introuvable.', 'NOT_FOUND', 404);

        const isMatch = await bcrypt.compare(currentPass, user.password);
        if (!isMatch) throw new AuthError('Ancien mot de passe incorrect.', 'INVALID_PASSWORD', 400);

        user.password = await bcrypt.hash(newPass, 10);
        await user.save();
    }

    // --- Autres méthodes (Login, Verify, etc.) ---
    async verifyOtp(email: string, otp: string) {
        const user = await models.User.findOne({ where: { email }, include: [{ model: models.Role, as: 'role' }] });
        if (!user || user.otpCode !== otp || new Date() > user.otpExpiresAt!) {
            throw new AuthError('Code invalide ou expiré.', 'INVALID_OTP', 400);
        }
        user.isActive = true;
        user.otpCode = null;
        user.otpExpiresAt = null;
        await user.save();
        const roleName = (user as any).role?.name || 'User';
        const token = generateJwtToken({ userId: user.id, email: user.email, roles: [roleName], hospitalId: user.hospitalId });
        return { token, user: { id: user.id, email: user.email, roleName, hospitalId: user.hospitalId } };
    }

    async login(data: LoginRequest) {
        const user = await models.User.findOne({ where: { email: data.email }, include: [{ model: models.Role, as: 'role' }] });
        if (!user || !(await bcrypt.compare(data.password, user.password))) throw new AuthError('Identifiants invalides.', 'INVALID_CREDENTIALS', 401);
        if (!user.isActive) throw new AuthError('Compte non activé.', 'UNVERIFIED', 403);
        const roleName = (user as any).role?.name || 'User';
        const token = generateJwtToken({ userId: user.id, email: user.email, roles: [roleName], hospitalId: user.hospitalId });
        return { token, user: { id: user.id, email: user.email, roleName, hospitalId: user.hospitalId } };
    }

    async getCurrentUser(userId: string) {
        const user = await models.User.findByPk(userId, { include: [{ model: models.Role, as: 'role' }, { model: models.Hospital, as: 'hospital' }] });
        if (!user) throw new AuthError('Utilisateur introuvable.', 'NOT_FOUND', 404);
        return { id: user.id, email: user.email, roleName: (user as any).role?.name, hospitalId: user.hospitalId, hospital: user.hospital };
    }

    async forgotPassword(email: string) {
        const user = await models.User.findOne({ where: { email } });
        if (!user) return;
        const otp = this.generateOTP();
        user.otpCode = otp;
        user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();
        await sendOtpEmail(email, otp, 'PASSWORD_RESET');
    }

    async resetPassword(data: any) {
        const user = await models.User.findOne({ where: { email: data.email, otpCode: data.otp } });
        if (!user || new Date() > user.otpExpiresAt!) throw new AuthError('Code invalide.', 'INVALID_RESET', 400);
        user.password = await bcrypt.hash(data.newPassword, 10);
        user.otpCode = null;
        user.otpExpiresAt = null;
        user.isActive = true;
        await user.save();
    }
}

export default new AuthService();