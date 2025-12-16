// src/controllers/PatientController.ts

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../auth/types/auth.types';
import { PatientAttributes } from '../models/patient';
import { PatientService } from '../services/patient.service';
import { GetPatientsOptions, PatientPeriod } from '../types/patient.type';
import { BadRequestError } from '../shared/errors/custom.error';

const patientService = new PatientService();

export class PatientController {

    /**
     * @route GET /api/v1/patients/stats
     */
    public async getPatientStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            // Correction Erreur 1: On extrait et on vérifie strictement la présence de l'ID
            const hospitalId = req.user?.hospitalId;
            
            if (typeof hospitalId !== 'string') {
                throw new BadRequestError("Hospital ID is missing or invalid in user token.");
            }

            const period = (req.query.period as PatientPeriod) || 'thisMonth';

            // hospitalId est maintenant garanti d'être une string simple
            const stats = await patientService.getPatientStats(hospitalId, period);
            res.status(200).json(stats);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @route GET /api/v1/patients
     */
    public async getPatients(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const hospitalId = req.user?.hospitalId; 
            const superAdminFilter = req.query.hospitalId as string | undefined;

            const options: GetPatientsOptions = {
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10,
                search: req.query.search as string | undefined,
                status: req.query.status as any,
                hospitalId: superAdminFilter || undefined // Force undefined si null
            };

            const role = req.user?.roleName;
            let scopeId: string | undefined = undefined;

            // Correction Erreur 2: On s'assure que scopeId ne reçoit jamais 'null'
            if (role === 'Hospital Admin' || role === 'Doctor') {
                if (hospitalId) scopeId = hospitalId;
            }

            if (!scopeId && !superAdminFilter && role !== 'Super Admin') {
                throw new BadRequestError("L'ID de l'hôpital est requis pour cette opération.");
            }

            const data = await patientService.getPatients(scopeId, options);
            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @route GET /api/v1/patients/:id
     */
    public async getPatientById(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const patientId = req.params.id;
            // Correction Erreur 3: On s'assure que patientId est bien défini
            if (!patientId) throw new BadRequestError("Patient ID is required.");

            const patient = await patientService.getPatientById(patientId);
            res.status(200).json(patient);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @route PATCH /api/v1/patients/:id
     */
    public async updatePatient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const patientId = req.params.id;
            if (!patientId) throw new BadRequestError("Patient ID is required.");

            const updateData: Partial<PatientAttributes> = req.body;
            const updatedPatient = await patientService.updatePatient(patientId, updateData);
            res.status(200).json(updatedPatient);
        } catch (error) {
            next(error);
        }
    }

    /**
     * @route DELETE /api/v1/patients/:id
     */
    public async deletePatient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const patientId = req.params.id;
            if (!patientId) throw new BadRequestError("Patient ID is required.");

            await patientService.deletePatient(patientId);
            res.status(204).end();
        } catch (error) {
            next(error);
        }
    }

    /**
     * @route POST /api/v1/patients
     */
    public async createPatient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
        try {
            const patientData: PatientAttributes = req.body;
            const newPatient = await patientService.createPatient(patientData);
            res.status(201).json(newPatient);
        } catch (error) {
            next(error);
        }
    }
}