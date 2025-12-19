import { col, fn, Op } from 'sequelize';
import { models } from '../models';
// CORRECTION : Chemin vers shared (remonte de services vers src, puis shared)
import { InternalServerError, NotFoundError } from '../shared/errors/custom.error';
// CORRECTION : Retrait de l'extension .ts (interdit en import TS standard)
import {
    PatientPeriod,
    GetPatientsOptions,
    PatientsResponse
} from '../types/patient.type';

export class PatientService {

    private getPeriodDates(period: PatientPeriod): { startDate: Date | null, endDate: Date } {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let startDate: Date | null = null;
        let endDate: Date = new Date();
        endDate.setHours(23, 59, 59, 999);

        switch (period) {
            case 'today': startDate = new Date(today); break;
            case 'thisWeek':
                startDate = new Date(today);
                const day = today.getDay();
                const diff = today.getDate() - day + (day === 0 ? -6 : 1);
                startDate.setDate(diff);
                break;
            case 'thisMonth': startDate = new Date(today.getFullYear(), today.getMonth(), 1); break;
            case 'lastMonth':
                startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                endDate = new Date(today.getFullYear(), today.getMonth(), 0);
                endDate.setHours(23, 59, 59, 999);
                break;
            default: startDate = null; break;
        }
        return { startDate, endDate };
    }

    private translatePeriod(period: PatientPeriod): string {
        const translations: Record<string, string> = {
            today: "aujourd'hui",
            thisWeek: "cette semaine",
            thisMonth: "ce mois",
            lastMonth: "le mois dernier",
            allTime: "tout temps"
        };
        return translations[period] || period;
    }

    private calculateTrend(current: number, previous: number) {
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let percentage = 0;
        if (previous > 0) {
            const change = ((current - previous) / previous) * 100;
            trend = change > 0 ? 'up' : (change < 0 ? 'down' : 'stable');
            percentage = Math.abs(Math.round(change));
        } else if (current > 0) {
            trend = 'up';
            percentage = 100;
        }
        return { trend, percentage };
    }

    public async getPatients(options: GetPatientsOptions): Promise<PatientsResponse> {
        try {
            const { page, limit, search, status, hospitalId } = options;
            const offset = (page - 1) * limit;
            const whereClause: any = { hospitalId };

            if (status && status !== 'All') whereClause.status = status;
            if (search) {
                whereClause[Op.or] = [
                    { firstName: { [Op.iLike]: `%${search}%` } },
                    { lastName: { [Op.iLike]: `%${search}%` } },
                    { idNumber: { [Op.iLike]: `%${search}%` } }
                ];
            }

            const { rows, count } = await (models.Patient as any).findAndCountAll({
                where: whereClause,
                limit,
                offset,
                order: [['createdAt', 'DESC']],
            });

            const patients = rows.map((p: any) => ({
                ...p.get({ plain: true }),
                id: p.patientId,
                name: `${p.firstName} ${p.lastName}`,
            }));

            return { patients, total: count, page, limit };
        } catch (error) {
            throw new InternalServerError("Erreur lors de la récupération des patients.");
        }
    }

    public async getPatientById(patientId: string, hospitalId: string): Promise<any> {
        const patient = await (models.Patient as any).findOne({
            where: { patientId, hospitalId }
        });
        if (!patient) throw new NotFoundError("Patient non trouvé.");
        return {
            ...patient.get({ plain: true }),
            id: patient.patientId,
            name: `${patient.firstName} ${patient.lastName}`
        };
    }

    public async updatePatient(patientId: string, hospitalId: string, data: any): Promise<any> {
        const patient = await (models.Patient as any).findOne({
            where: { patientId, hospitalId }
        });
        if (!patient) throw new NotFoundError("Patient non trouvé.");
        await patient.update(data);
        return patient.get({ plain: true });
    }

    public async getPatientStats(hospitalId: string, period: PatientPeriod = 'thisMonth'): Promise<any> {
        try {
            const { startDate, endDate } = this.getPeriodDates(period);
            const periodFr = this.translatePeriod(period);

            let prevStartDate: Date | null = null;
            let prevEndDate: Date | null = null;
            if (startDate) {
                const diff = endDate.getTime() - startDate.getTime();
                prevEndDate = new Date(startDate.getTime() - 1);
                prevStartDate = new Date(prevEndDate.getTime() - diff);
            }

            const totalOverall = await (models.Patient as any).count({ where: { hospitalId } });
            const activePatients = await (models.Patient as any).count({ where: { hospitalId, status: 'Active' } });

            const currentNew = await (models.Patient as any).count({
                where: { hospitalId, createdAt: startDate ? { [Op.between]: [startDate, endDate] } : { [Op.ne]: null } }
            });
            const prevNew = prevStartDate ? await (models.Patient as any).count({
                where: { hospitalId, createdAt: { [Op.between]: [prevStartDate, prevEndDate!] } }
            }) : 0;

            const currentAppts = await (models.Appointment as any).count({
                where: { hospitalId, startTime: startDate ? { [Op.between]: [startDate, endDate] } : { [Op.ne]: null } }
            });
            const prevAppts = prevStartDate ? await (models.Appointment as any).count({
                where: { hospitalId, startTime: { [Op.between]: [prevStartDate, prevEndDate!] } }
            }) : 0;

            const newPatientTrend = this.calculateTrend(currentNew, prevNew);
            const apptTrend = this.calculateTrend(currentAppts, prevAppts);

            return [
                {
                    iconKey: "users",
                    title: "Patients Actifs",
                    count: activePatients,
                    trend: "stable",
                    percentage: `${Math.round((activePatients / (totalOverall || 1)) * 100)}%`,
                    subtitle: `Sur ${totalOverall} patients enregistrés`
                },
                {
                    iconKey: "userPlus",
                    title: "Nouveaux Patients",
                    count: currentNew,
                    trend: newPatientTrend.trend,
                    percentage: `${newPatientTrend.trend === 'up' ? '+' : '-'}${newPatientTrend.percentage}%`,
                    subtitle: `vs période précédente`
                },
                {
                    iconKey: "calendar",
                    title: "Rendez-vous",
                    count: currentAppts,
                    trend: apptTrend.trend,
                    percentage: `${apptTrend.trend === 'up' ? '+' : '-'}${apptTrend.percentage}%`,
                    subtitle: period === 'allTime' ? "Total historique" : `Période : ${periodFr}`
                }
            ];
        } catch (error) {
            throw new InternalServerError("Impossible de générer les statistiques.");
        }
    }

    public async createPatient(data: any): Promise<any> {
        return await (models.Patient as any).create(data);
    }

    public async deletePatient(patientId: string, hospitalId: string): Promise<void> {
        const deleted = await (models.Patient as any).destroy({
            where: { patientId, hospitalId }
        });
        if (!deleted) throw new NotFoundError("Patient non trouvé.");
    }
}