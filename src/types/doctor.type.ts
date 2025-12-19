export type DoctorPeriod = 'today' | 'thisWeek' | 'thisMonth' | 'lastMonth' | 'allTime';

/**
 * Interface pour les statistiques (même si non utilisées actuellement dans le service,
 * utile pour la cohérence du typage front-end)
 */
export interface DoctorStats {
    totalDoctors: number;
    activeConsultations: number;
    doctorTrend: 'up' | 'down' | 'stable';
    activityPercentage: number;
}

/**
 * Options de filtrage et pagination pour la récupération des docteurs
 */
export interface GetDoctorsOptions {
    page: number;
    limit: number;
    search?: string;
    specialty?: string; // Remplace 'status' des patients
    hospitalId: string;
}

/**
 * Structure de la réponse retournée par le service et le controller
 */
export interface DoctorsResponse {
    doctors: any[]; // On peut affiner avec DoctorAttributes si nécessaire
    total: number;
    page: number;
    limit: number;
}