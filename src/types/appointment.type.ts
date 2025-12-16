// src/types/appointment.types.ts

import { AppointmentAttributes, AppointmentStatusEnum } from '../models/appointment';

// --- Types pour les Options de Requête (Pagination, Filtre) ---

export type AppointmentStatus = AppointmentStatusEnum;

export interface GetAppointmentsOptions {
    page: number;
    limit: number;
    search?: string; 
    status?: AppointmentStatus | 'ALL';
    date?: string;
    doctorId?: string;
}

export interface AppointmentsResponse {
    appointments: AppointmentAttributes[];
    total: number;
    page: number;
    limit: number;
}

// --- Types pour la Création/Mise à jour (Payload) ---

// Les champs nécessaires pour la création (exclut l'ID et l'HospitalID qui vient du token)
export interface CreateAppointmentPayload {
    startTime: Date;
    endTime: Date;
    doctorId: string;
    patientId: string;

}

export interface UpdateAppointmentPayload extends Partial<CreateAppointmentPayload> {
    status?: AppointmentStatus;
}

// --- Types pour les Statistiques ---

export type AppointmentPeriod = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'allTime';
export type Trend = 'up' | 'down' | 'stable';

export interface AppointmentStats {
    scheduledToday: number;
    completedToday: number;
    totalScheduled: number;
    totalCompleted: number;
    totalCancelled: number;
    scheduledTrend: Trend;
    scheduledPercentageChange: number;
}