// src/routes/patient.route.ts

import { Router, Request, Response, NextFunction } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authorize } from '../auth/middlewares/authorize.middleware';
import { authenticate } from '../auth/middlewares/auth.middleware';

const router = Router();
const patientController = new PatientController();

// Applique l'authentification
router.use(authenticate as any); // Le 'as any' ici règle le conflit global sur router.use

// --- Routes ---

router.get(
    '/stats',
    authorize(['Hospital Admin', 'Doctor']),
    (req: Request, res: Response, next: NextFunction) => patientController.getPatientStats(req as any, res, next)
);

router.post(
    '/',
    authorize(['Hospital Admin']),
    (req: Request, res: Response, next: NextFunction) => patientController.createPatient(req as any, res, next)
);

router.get(
    '/',
    authorize(['Hospital Admin', 'Doctor', 'Super Admin']),
    (req: Request, res: Response, next: NextFunction) => patientController.getPatients(req as any, res, next)
);

router.get(
    '/:id',
    authorize(['Hospital Admin', 'Doctor', 'Super Admin', 'Patient']),
    (req: Request, res: Response, next: NextFunction) => patientController.getPatientById(req as any, res, next)
);

router.patch(
    '/:id',
    authorize(['Hospital Admin', 'Doctor']),
    (req: Request, res: Response, next: NextFunction) => patientController.updatePatient(req as any, res, next)
);

router.delete(
    
    '/:id',
    authorize(['Hospital Admin', 'Super Admin']),
    (req: Request, res: Response, next: NextFunction) => patientController.deletePatient(req as any, res, next)
);

export default router;