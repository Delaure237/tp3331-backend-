import { Response, NextFunction } from 'express';
import { DoctorService } from '../services/doctor.service';
import { GetDoctorsOptions } from '../types/doctor.type';
import { BadRequestError } from '../shared/errors/custom.error';
import { AuthenticatedRequest } from '../auth/types/auth.types';

export class DoctorController {
    private doctorService: DoctorService;

    constructor() {
        this.doctorService = new DoctorService();
    }

    /**
     * LISTE DES DOCTEURS
     */
    async getDoctors(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const hospitalId = req.user?.hospitalId;
            if (!hospitalId) throw new BadRequestError('Hospital ID is missing.');

            const options: GetDoctorsOptions = {
                hospitalId,
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10,
                // Utilisation de ?? "" pour garantir une string si le champ est undefined
                search: (req.query.search as string) ?? "",
                specialty: (req.query.specialty as string) ?? "All"
            };

            const result = await this.doctorService.getDoctors(options);

            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * RÉCUPÉRER UN DOCTEUR PAR ID
     */
    async getDoctorById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { doctorId } = req.params;
            const hospitalId = req.user?.hospitalId;

            // Vérification explicite du paramètre pour TS
            if (!doctorId) throw new BadRequestError('Doctor ID is required.');
            if (!hospitalId) throw new BadRequestError('Hospital ID is missing.');

            const doctor = await this.doctorService.getDoctorById(doctorId, hospitalId);

            res.status(200).json({
                success: true,
                doctor
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * CRÉER UN DOCTEUR
     */
    async createDoctor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const hospitalId = req.user?.hospitalId;
            if (!hospitalId) throw new BadRequestError('Hospital ID is required.');

            const doctor = await this.doctorService.createDoctor({
                ...req.body,
                hospitalId
            });

            res.status(201).json({
                success: true,
                message: 'Doctor profile created successfully.',
                doctor
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * METTRE À JOUR UN DOCTEUR
     */
    async updateDoctor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { doctorId } = req.params;
            const hospitalId = req.user?.hospitalId;

            if (!doctorId) throw new BadRequestError('Doctor ID is required.');
            if (!hospitalId) throw new BadRequestError('Hospital ID is missing.');

            const updatedDoctor = await this.doctorService.updateDoctor(doctorId, hospitalId, req.body);

            res.status(200).json({
                success: true,
                message: 'Doctor updated successfully.',
                doctor: updatedDoctor
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * SUPPRIMER UN DOCTEUR
     */
    async deleteDoctor(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const { doctorId } = req.params;
            const hospitalId = req.user?.hospitalId;

            if (!doctorId) throw new BadRequestError('Doctor ID is required.');
            if (!hospitalId) throw new BadRequestError('Hospital ID is missing.');

            await this.doctorService.deleteDoctor(doctorId, hospitalId);

            res.status(200).json({
                success: true,
                message: 'Doctor deleted successfully.'
            });
        } catch (error) {
            next(error);
        }
    }

    async getDoctorStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
        const hospitalId = req.user?.hospitalId;
        const period = (req.query.period as string) || 'thisMonth';

        if (!hospitalId) throw new BadRequestError('Hospital ID is missing.');

        const stats = await this.doctorService.getDoctorStats(hospitalId, period);
        res.status(200).json(stats);
    } catch (error) {
        next(error);
    }
}
}