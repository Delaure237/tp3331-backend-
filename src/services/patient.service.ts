import { Op } from 'sequelize';
import { models } from '../models';
import { PatientAttributes } from '../models/patient';
import { UserAttributes } from '../models/user';
import { InternalServerError, NotFoundError } from '../shared/errors/custom.error';
import { GetPatientsOptions, PatientsResponse, PatientPeriod, PatientStats } from '../types/patient.type';

// Correction de l'interface pour éviter les conflits avec les modèles Sequelize complexes

export class PatientService {

    /**
     * @description Création d'un nouveau patient.
     */
    public async createPatient(data: PatientAttributes): Promise<PatientAttributes> {
        try {
            const patient = await models.Patient.create(data);
            return patient.get({ plain: true }) as PatientAttributes;
        } catch (error) {
            console.error('Error creating patient:', error);
            throw new InternalServerError("Impossible de créer le patient.");
        }
    }

    /**
     * @description Récupère les informations spécifiques d'un patient.
     */
    public async getPatientById(patientId: string): Promise<PatientAttributes> {
        try {
            const patient = await models.Patient.findOne({
                where: { patientId },
                include: [
                    {
                        model: models.User,
                        as: 'userProfile',
                        attributes: ['email', 'phoneNumber', 'createdAt']
                    },
                    { model: models.Hospital, as: 'hospital', attributes: ['hospitalName'] }
                ],
            });

            if (!patient) {
                throw new NotFoundError(`Patient with ID ${patientId} not found.`);
            }

            return patient.get({ plain: true }) as PatientAttributes;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new InternalServerError("Impossible de récupérer les détails du patient.");
        }
    }

    /**
     * @description Récupère la liste des patients avec pagination et filtres.
     */
    public async getPatients(scopeHospitalId: string | undefined, options: GetPatientsOptions): Promise<PatientsResponse> {
        try {
            const { page, limit, search, status, hospitalId: explicitHospitalId } = options;
            const offset = (page - 1) * limit;

            const whereClause: any = {};
            const userWhereClause: any = {};

            const effectiveHospitalId = scopeHospitalId || explicitHospitalId;
            if (effectiveHospitalId) {
                 whereClause.hospitalId = effectiveHospitalId;
            }

            if (status) {
                whereClause.status = status;
            }

            let isUserSearchActive = false;
            if (search) {
                const searchConditions = { [Op.like]: `%${search}%` };
                whereClause[Op.or] = [
                    { firstName: searchConditions },
                    { lastName: searchConditions },
                    { idNumber: searchConditions },
                ];

                userWhereClause[Op.or] = [
                    { email: searchConditions },
                    { phoneNumber: searchConditions },
                ];
                isUserSearchActive = true;
            }

            const result = await models.Patient.findAndCountAll({
                where: whereClause,
                limit,
                offset,
                order: [['lastName', 'ASC'], ['firstName', 'ASC']],
                include: [
                    {
                        model: models.User,
                        as: 'userProfile',
                        attributes: ['email', 'phoneNumber', 'createdAt'],
                        where: isUserSearchActive ? userWhereClause : {},
                        required: isUserSearchActive
                    },
                    { model: models.Hospital, as: 'hospital', attributes: ['hospitalName'] },
                ],
                subQuery: false
            });

            return {
                patients: result.rows.map(row => row.get({ plain: true })) as PatientAttributes[],
                total: result.count,
                page,
                limit,
            };

        } catch (error) {
            console.error(`Error fetching patients:`, error);
            throw new InternalServerError("Impossible de récupérer la liste des patients.");
        }
    }

    /**
     * @description Met à jour les informations d'un patient.
     */
    public async updatePatient(patientId: string, updateData: Partial<PatientAttributes>): Promise<PatientAttributes> {
        try {
            const [rowsAffected] = await models.Patient.update(updateData, {
                where: { patientId }
            });

            if (rowsAffected === 0) {
                throw new NotFoundError(`Patient with ID ${patientId} not found.`);
            }

            return this.getPatientById(patientId);
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new InternalServerError("Impossible de mettre à jour le patient.");
        }
    }

    /**
     * @description Supprime un patient (suppression de l'User associé).
     */
    public async deletePatient(patientId: string): Promise<void> {
        try {
            const patient = await models.Patient.findByPk(patientId);
            if (!patient) throw new NotFoundError(`Patient with ID ${patientId} not found.`);

            // On utilise 'id' si 'userId' n'est pas reconnu par votre interface UserAttributes
            await models.User.destroy({ where: { id: (patient as any).userId } });

        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new InternalServerError("Impossible de supprimer le patient.");
        }
    }

    /**
     * @description Récupère les statistiques agrégées.
     */
    public async getPatientStats(hospitalId: string, period: PatientPeriod = 'thisMonth'): Promise<PatientStats> {
        try {
            const { startDate, endDate, prevStartDate, prevEndDate } = this.getPeriodDates(period);
            const baseWhereClause: any = hospitalId ? { hospitalId } : {};

            const fetchStatsForPeriod = async (start: Date | null, end: Date | null, current = true) => {
                const dateFilter = start && end ? { [Op.between]: [start, end] } : null;

                const totalPatients = await models.Patient.count({ where: baseWhereClause });

                const newPatients = await models.Patient.count({
                     where: baseWhereClause,
                     include: [{
                         model: models.User,
                         as: 'userProfile',
                         where: dateFilter ? { createdAt: dateFilter } : {},
                         required: !!dateFilter
                     }]
                });

                const activePatients = current ? await models.Patient.count({ where: { ...baseWhereClause, status: 'Active' } }) : 0;
                const nonActivePatients = current ? await models.Patient.count({ where: { ...baseWhereClause, status: 'Non-Active' } }) : 0;

                const appointments = dateFilter
                    ? await models.Appointment.count({ where: { ...baseWhereClause, startTime: dateFilter } })
                    : 0;

                return { totalPatients, newPatients, activePatients, nonActivePatients, appointments };
            };

            const currentStats = await fetchStatsForPeriod(startDate, endDate, true);
            let prevStats = { newPatients: 0, appointments: 0 };

            if (prevStartDate && prevEndDate) {
                const rawPrev = await fetchStatsForPeriod(prevStartDate, prevEndDate, false);
                prevStats.newPatients = rawPrev.newPatients;
                prevStats.appointments = rawPrev.appointments;
            }

            const newPatientsTrend = this.calculateTrend(currentStats.newPatients, prevStats.newPatients);
            const appointmentsTrend = this.calculateTrend(currentStats.appointments, prevStats.appointments);

            return {
                totalPatients: currentStats.totalPatients,
                newPatients: currentStats.newPatients,
                activePatients: currentStats.activePatients,
                nonActivePatients: currentStats.nonActivePatients,
                newPatientsTrend: newPatientsTrend.trend,
                newPatientsPercentageChange: newPatientsTrend.percentageChange,
                appointmentsToday: currentStats.appointments,
                appointmentsTodayTrend: appointmentsTrend.trend,
                appointmentsTodayPercentageChange: appointmentsTrend.percentageChange,
            };

        } catch (error) {
            throw new InternalServerError("Impossible de récupérer les statistiques.");
        }
    }

    // --- Fonctions Utilitaires Internes ---

    private getPeriodDates(period: PatientPeriod) {
        const now = new Date();
        let startDate: Date, endDate: Date, prevStartDate: Date, prevEndDate: Date;

        switch (period) {
            case 'thisWeek':
                startDate = new Date(now.setDate(now.getDate() - now.getDay()));
                endDate = new Date();
                prevStartDate = new Date(startDate); prevStartDate.setDate(startDate.getDate() - 7);
                prevEndDate = new Date(startDate);
                break;
            case 'thisMonth':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date();
                prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
        }
        return { startDate, endDate, prevStartDate, prevEndDate };
    }

    private calculateTrend(current: number, previous: number) {
        if (previous === 0) return { trend: 'up' as const, percentageChange: current > 0 ? 100 : 0 };
        const change = ((current - previous) / previous) * 100;
        return {
            trend: change >= 0 ? 'up' as const : 'down' as const,
            percentageChange: Math.abs(Math.round(change))
        };
    }
}