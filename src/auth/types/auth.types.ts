// src/auth/types/auth.types.ts

import { Request } from 'express';
import { PatientAttributes } from '../../models/patient';
import { DoctorAttributes } from '../../models/doctor';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface PatientSignUpRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    idNumber: string;
    insurance: string;
}

export interface StaffUserCreationRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    jobTitle: string;
    roleName: string;
    phoneNumber?: string;
}

// AJOUT : Interface pour l'inscription d'hôpital
export interface RegisterHospitalRequest {
    hospitalName: string;
    hospitalEmail: string;
    phoneNumber1: string;
    phoneNumber2?: string;
    address: string;
    openingHours: string;
    services: string[];
    password: string;
    adminFirstName: string;
    adminLastName: string;
    adminPhone: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface ResetPasswordRequest {
    resetToken: string;
    newPassword: string;
}

export interface AuthTokenPayload {
    userId: string;
    email: string;
    hospitalId: string | null | undefined;
    roles: string[]; // Modifié de 'role: string' à 'roles: string[]' pour matcher JwtPayload
}

export interface AuthResponse {
    token: string;
    user: {
        id: string;
        email: string;
        roleName: string;
        hospitalId: string | null;
    };
}

// AJOUT : Interface pour la réponse d'hôpital
export interface HospitalAuthResponse extends AuthResponse {
    hospital: any;
}

export interface CurrentUserResponse {
    id: string;
    email: string;
    roleName: string;
    hospitalId: string | null;
    profile: PatientAttributes | DoctorAttributes | null;
}

export interface AuthenticatedUser {
    id: string;
    email: string;
    roleName: string;
    hospitalId: string | null;
    roleId: string;
}

export interface AuthenticatedRequest extends Request {
    user: AuthenticatedUser;
    body: any;
    files?: any; // Ajouté pour gérer les uploads
}