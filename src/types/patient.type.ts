

export type PatientPeriod = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'allTime';

export interface PatientStats {
    totalPatients: number;
    newPatients: number;
    activePatients: number;
    patientTrend: 'up' | 'down' | 'stable';
    patientPercentage: number;
    // On peut ajouter d'autres stats selon le besoin du front
}

export interface GetPatientsOptions {
    page: number;
    limit: number;
    search?: string;
    status?: string;
    hospitalId: string;
}

export interface PatientsResponse {
    patients: any[];
    total: number;
    page: number;
    limit: number;
}