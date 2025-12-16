import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/types/auth.types';
import { AuthError } from '../auth/utils/error';
import { AppointmentService } from '../services/appointment.service';
import {
    AppointmentPeriod,
    CreateAppointmentPayload,
    GetAppointmentsOptions,
    UpdateAppointmentPayload
} from '../types/appointment.type';

const appointmentService = new AppointmentService();

export class AppointmentController {

    public getAppointmentStats = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitalId = req.user?.hospitalId;
            // Validation stricte : si hospitalId est absent, on arrête tout.
            if (!hospitalId) throw new AuthError("Hospital ID is missing.", "TOKEN_ERROR", 400);

            const period = (req.query.period as AppointmentPeriod) || 'thisMonth';

            // Ici hospitalId est garanti d'être de type 'string'
            const stats = await appointmentService.getAppointmentStats(hospitalId, period);
            res.status(200).json(stats);
        } catch (error) {
            next(error);
        }
    };

    public createAppointment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitalId = req.user?.hospitalId;
            if (!hospitalId) throw new AuthError("Hospital ID is missing.", "TOKEN_ERROR", 400);

            const payload: CreateAppointmentPayload = req.body;
            const newAppointment = await appointmentService.createAppointment(hospitalId, payload);
            res.status(201).json(newAppointment);
        } catch (error) {
            next(error);
        }
    };

    public getAppointments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitalId = req.user?.hospitalId;
            if (!hospitalId) throw new AuthError("Hospital ID is missing.", "TOKEN_ERROR", 400);

            // Gestion de exactOptionalPropertyTypes : on ne définit que les champs présents
            const options: GetAppointmentsOptions = {
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10,
                status: req.query.status as any
            };

            if (req.query.search) options.search = req.query.search as string;
            if (req.query.date) options.date = req.query.date as string;
            if (req.query.doctorId) options.doctorId = req.query.doctorId as string;

            const data = await appointmentService.getAppointments(hospitalId, options);
            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };

    public getAppointmentById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitalId = req.user?.hospitalId;
            if (!hospitalId) throw new AuthError("Hospital ID is missing.", "TOKEN_ERROR", 400);

            const appointmentId = req.params.id;
            // On s'assure que appointmentId est aussi une string
            if (!appointmentId) throw new AuthError("Appointment ID is required.", "VALIDATION_ERROR", 400);

            const appointment = await appointmentService.getAppointmentById(appointmentId, hospitalId);
            res.status(200).json(appointment);
        } catch (error) {
            next(error);
        }
    };

    public updateAppointment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitalId = req.user?.hospitalId;
            if (!hospitalId) throw new AuthError("Hospital ID is missing.", "TOKEN_ERROR", 400);

            const appointmentId = req.params.id;
            if (!appointmentId) throw new AuthError("Appointment ID is required.", "VALIDATION_ERROR", 400);

            const updateData: UpdateAppointmentPayload = req.body;

            const updatedAppointment = await appointmentService.updateAppointment(appointmentId, hospitalId, updateData);
            res.status(200).json(updatedAppointment);
        } catch (error) {
            next(error);
        }
    };

    public deleteAppointment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitalId = req.user?.hospitalId;
            if (!hospitalId) throw new AuthError("Hospital ID is missing.", "TOKEN_ERROR", 400);

            const appointmentId = req.params.id;
            if (!appointmentId) throw new AuthError("Appointment ID is required.", "VALIDATION_ERROR", 400);

            await appointmentService.deleteAppointment(appointmentId, hospitalId);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    };
}