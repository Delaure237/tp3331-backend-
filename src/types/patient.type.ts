// src/patient/types/patient.types.ts

import { PatientAttributes } from '../../models/patient';

// --- Types pour la gestion des données paginées ---
export type PatientStatus = PatientAttributes['status'];

export interface GetPatientsOptions {
    page: number;
    limit: number;
    search?: string | undefined; // Recherche par nom, prénom, téléphone (via User)
    status?: PatientStatus; // Filtrage par statut (Active, Non-Active, New Patient)
    hospitalId?: string | undefined; // Filtrage par hôpital (si l'utilisateur est un Super Admin)
}

export interface PatientsResponse {
    patients: PatientAttributes[]; // Utilise l'interface Sequelize pour l'instant
    total: number;
    page: number;
    limit: number;
}

// --- Types pour la gestion des statistiques et tendances ---

export type PatientPeriod = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'allTime';
export type Trend = 'up' | 'down' | 'stable';

export interface PatientStats {
    totalPatients: number;
    newPatients: number;
    activePatients: number;
    nonActivePatients: number;
    newPatientsTrend: Trend;
    newPatientsPercentageChange: number;
    appointmentsToday: number;
    appointmentsTodayTrend: Trend;
    appointmentsTodayPercentageChange: number;
}