import { Request, Response, NextFunction } from 'express';
import { PatientService } from '../services/patient.service';
import { PatientPeriod, GetPatientsOptions } from '../types/patient.type';

export class PatientController {
    private patientService: PatientService;

    constructor() {
        this.patientService = new PatientService();
    }

    public getPatients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitalId = (req as any).user.hospitalId as string;

            const options: GetPatientsOptions = {
                page: parseInt(req.query.page as string) || 1,
                limit: parseInt(req.query.limit as string) || 10,
                search: req.query.search as string,
                status: req.query.status as string,
                hospitalId
            };

            const result = await this.patientService.getPatients(options);
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    public getPatientStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitalId = (req as any).user.hospitalId as string;
            const period = (req.query.period as PatientPeriod) || 'thisMonth';

            const stats = await this.patientService.getPatientStats(hospitalId, period);
            res.status(200).json(stats);
        } catch (error) {
            next(error);
        }
    };

    public getPatientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const patientId = req.params.patientId as string;
            const hospitalId = (req as any).user.hospitalId as string;

            const patient = await this.patientService.getPatientById(patientId, hospitalId);
            res.status(200).json(patient);
        } catch (error) {
            next(error);
        }
    };

    public createPatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitalId = (req as any).user.hospitalId as string;

            // MAPPING PRAGMATIQUE :
            // On transforme les champs du formulaire frontend vers les colonnes Sequelize
            const mappedData = {
                firstName: req.body.patientFirstName,
                lastName: req.body.patientLastName,
                idNumber: req.body.healthCareNumber,
                sex: req.body.sex,
                dateOfBirth: req.body.dateOfBirth || null,
                phone: req.body.phone || null,
                email: req.body.email || null,
                address: req.body.address || null,
                hospitalId: hospitalId,
                userId: null, // Autorisé par ta modification SQL
                status: 'New Patient'
            };

            const newPatient = await this.patientService.createPatient(mappedData);
            res.status(201).json(newPatient);
        } catch (error) {
            next(error);
        }
    };

    // patient.controller.ts
public updatePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        console.log("ID reçu dans le controller:", req.params.patientId);

        const patientId = req.params.patientId;
        if (!patientId || patientId === 'undefined') {
            res.status(400).json({ message: "L'identifiant du patient est requis." });
            return;
        }

        const hospitalId = (req as any).user.hospitalId;

        const updateData = {
            firstName: req.body.patientFirstName,
            lastName: req.body.patientLastName,
            idNumber: req.body.healthCareNumber,
            sex: req.body.sex,
            phone: req.body.phone,
            email: req.body.email,
            address: req.body.address
        };

        const updatedPatient = await this.patientService.updatePatient(patientId, hospitalId, updateData);
        res.status(200).json(updatedPatient);
    } catch (error) {
        next(error);
    }
};

    public deletePatient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const patientId = req.params.patientId as string;
            const hospitalId = (req as any).user.hospitalId as string;

            await this.patientService.deletePatient(patientId, hospitalId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    };
}