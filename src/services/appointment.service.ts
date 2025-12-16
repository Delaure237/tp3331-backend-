import { Op } from 'sequelize';
import { models } from '../models';
import { AppointmentAttributes, AppointmentCreationAttributes, AppointmentStatusEnum } from '../models/appointment';
import { ConflictError, InternalServerError, NotFoundError } from '../shared/errors/custom.error';
import {
    CreateAppointmentPayload,
    GetAppointmentsOptions,
    AppointmentsResponse,
    UpdateAppointmentPayload,
    AppointmentPeriod,
    AppointmentStats
} from '../types/appointment.type';

export class AppointmentService {

    /**
     * @description Vérifie si le créneau horaire est disponible pour le docteur.
     */
    private async checkAvailability(doctorId: string, startTime: Date, endTime: Date, excludeId?: string): Promise<void> {
        const appointmentIdCondition = excludeId ? { [Op.ne]: excludeId } : {};

        const overlappingAppointment = await models.Appointment.findOne({
            where: {
                doctorId,
                [Op.or]: [
                    { startTime: { [Op.lt]: endTime }, endTime: { [Op.gt]: startTime } },
                    { startTime: { [Op.gte]: startTime, [Op.lt]: endTime } },
                ],
                id: appointmentIdCondition,
                status: { [Op.in]: [AppointmentStatusEnum.SCHEDULED, AppointmentStatusEnum.COMPLETED] }
            },
        });

        if (overlappingAppointment) {
            throw new ConflictError("Le docteur est déjà occupé durant cette période.");
        }
    }

    public async createAppointment(hospitalId: string, data: CreateAppointmentPayload): Promise<AppointmentAttributes> {
        try {
            const { startTime, endTime, doctorId } = data;
            await this.checkAvailability(doctorId, startTime, endTime);

            const appointmentData: AppointmentCreationAttributes = {
                ...data,
                hospitalId,
                status: AppointmentStatusEnum.SCHEDULED,
            };

            const appointment = await models.Appointment.create(appointmentData);
            return appointment.get({ plain: true }) as AppointmentAttributes;
        } catch (error) {
            if (error instanceof ConflictError) throw error;
            throw new InternalServerError("Impossible de créer le rendez-vous.");
        }
    }

    public async getAppointmentById(appointmentId: string, hospitalId: string): Promise<AppointmentAttributes> {
        try {
            const appointment = await models.Appointment.findOne({
                where: { id: appointmentId, hospitalId },
                include: [
                    { model: models.Doctor, as: 'doctor', attributes: ['firstName', 'lastName'] },
                    { model: models.Patient, as: 'patient', attributes: ['firstName', 'lastName', 'idNumber'] },
                    { model: models.Exam, as: 'exam' }
                ],
            });

            if (!appointment) throw new NotFoundError(`Appointment not found.`);
            return appointment.get({ plain: true }) as AppointmentAttributes;
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new InternalServerError("Erreur lors de la récupération du rendez-vous.");
        }
    }

    public async getAppointments(hospitalId: string, options: GetAppointmentsOptions): Promise<AppointmentsResponse> {
        try {
            const { page, limit, search, status, date, doctorId } = options;
            const offset = (page - 1) * limit;
            const whereClause: any = { hospitalId };

            if (status && status !== 'ALL') whereClause.status = status;
            if (doctorId) whereClause.doctorId = doctorId;
            if (date) {
                const startOfDay = new Date(date); startOfDay.setUTCHours(0, 0, 0, 0);
                const endOfDay = new Date(date); endOfDay.setUTCHours(23, 59, 59, 999);
                whereClause.startTime = { [Op.between]: [startOfDay, endOfDay] };
            }

            const doctorWhere: any = search ? { [Op.or]: [{ firstName: { [Op.like]: `%${search}%` } }, { lastName: { [Op.like]: `%${search}%` } }] } : {};
            const patientWhere: any = search ? { [Op.or]: [{ firstName: { [Op.like]: `%${search}%` } }, { lastName: { [Op.like]: `%${search}%` } }] } : {};

            const result = await models.Appointment.findAndCountAll({
                where: whereClause,
                limit,
                offset,
                order: [['startTime', 'ASC']],
                include: [
                    { model: models.Doctor, as: 'doctor', attributes: ['firstName', 'lastName'], where: doctorWhere, required: !!search },
                    { model: models.Patient, as: 'patient', attributes: ['firstName', 'lastName'], where: patientWhere, required: !!search },
                ],
                subQuery: false
            });

            return {
                appointments: result.rows.map(row => row.get({ plain: true })) as AppointmentAttributes[],
                total: result.count,
                page,
                limit,
            };
        } catch (error) {
            throw new InternalServerError("Erreur lors de la récupération de la liste.");
        }
    }

    public async updateAppointment(appointmentId: string, hospitalId: string, updateData: UpdateAppointmentPayload): Promise<AppointmentAttributes> {
        try {
            const { startTime, endTime, doctorId } = updateData;
            if (startTime || endTime || doctorId) {
                const current = await models.Appointment.findByPk(appointmentId);
                if (!current) throw new NotFoundError("Appointment not found.");
                await this.checkAvailability(doctorId || current.doctorId, startTime || current.startTime, endTime || current.endTime, appointmentId);
            }

            const [rows] = await models.Appointment.update(updateData, { where: { id: appointmentId, hospitalId } });
            if (rows === 0) throw new NotFoundError("Update failed.");
            return this.getAppointmentById(appointmentId, hospitalId);
        } catch (error) {
            if (error instanceof NotFoundError || error instanceof ConflictError) throw error;
            throw new InternalServerError("Erreur de mise à jour.");
        }
    }

    public async deleteAppointment(appointmentId: string, hospitalId: string): Promise<void> {
        const rows = await models.Appointment.destroy({ where: { id: appointmentId, hospitalId } });
        if (rows === 0) throw new NotFoundError("Appointment not found.");
    }

    // --- Statistiques et Utilitaires ---

    public async getAppointmentStats(hospitalId: string, period: AppointmentPeriod = 'thisMonth'): Promise<AppointmentStats> {
        try {
            const { startDate, endDate, prevStartDate, prevEndDate } = this.getPeriodDates(period);
            const baseWhere = { hospitalId };

            const fetchStats = async (start: Date | null, end: Date | null) => {
                const dateFilter = start && end ? { startTime: { [Op.between]: [start, end] } } : {};
                const where = { ...baseWhere, ...dateFilter };

                return {
                    scheduled: await models.Appointment.count({ where: { ...where, status: AppointmentStatusEnum.SCHEDULED } }),
                    completed: await models.Appointment.count({ where: { ...where, status: AppointmentStatusEnum.COMPLETED } }),
                    cancelled: await models.Appointment.count({ where: { ...where, status: { [Op.in]: [AppointmentStatusEnum.CANCELLED, AppointmentStatusEnum.NO_SHOW] } } }),
                };
            };

            const today = new Date(); today.setUTCHours(0, 0, 0, 0);
            const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);

            const statsToday = await fetchStats(today, tomorrow);
            const currentStats = await fetchStats(startDate, endDate);

            let prevTotal = 0;
            if (prevStartDate && prevEndDate) {
                const prev = await fetchStats(prevStartDate, prevEndDate);
                prevTotal = prev.scheduled;
            }

            const trend = this.calculateTrend(currentStats.scheduled, prevTotal);

            return {
                scheduledToday: statsToday.scheduled,
                completedToday: statsToday.completed,
                totalScheduled: currentStats.scheduled,
                totalCompleted: currentStats.completed,
                totalCancelled: currentStats.cancelled,
                scheduledTrend: trend.trend,
                scheduledPercentageChange: trend.percentageChange,
            };
        } catch (error) {
            throw new InternalServerError("Erreur lors du calcul des statistiques.");
        }
    }

    private getPeriodDates(period: AppointmentPeriod) {
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