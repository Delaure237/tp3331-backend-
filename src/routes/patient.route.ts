import { Router, Request, Response, NextFunction } from 'express';
import { PatientController } from '../controllers/patient.controller';
import { authorize } from '../auth/middlewares/authorize.middleware';
import { authenticate } from '../auth/middlewares/auth.middleware';

const router = Router();
const patientController = new PatientController();

// Applique l'authentification à toutes les routes ci-dessous
router.use(authenticate as any);

// --- Routes ---

/**
 * RÉCUPÉRER LES STATISTIQUES
 */
router.get(
    '/stats',
    authorize(['Hospital Admin', 'Doctor']),
    (req: Request, res: Response, next: NextFunction) => patientController.getPatientStats(req as any, res, next)
);

/**
 * CRÉER UN PATIENT
 */
router.post(
    '/',
    authorize(['Hospital Admin']),
    (req: Request, res: Response, next: NextFunction) => patientController.createPatient(req as any, res, next)
);

/**
 * LISTE DES PATIENTS (Recherche & Pagination)
 */
router.get(
    '/',
    authorize(['Hospital Admin', 'Doctor', 'Super Admin']),
    (req: Request, res: Response, next: NextFunction) => patientController.getPatients(req as any, res, next)
);

/**
 * RÉCUPÉRER UN PATIENT PAR ID
 * Note: Utilisation de :patientId pour matcher le controller
 */
router.get(
    '/:patientId',
    authorize(['Hospital Admin', 'Doctor', 'Super Admin', 'Patient']),
    (req: Request, res: Response, next: NextFunction) => patientController.getPatientById(req as any, res, next)
);

/**
 * METTRE À JOUR UN PATIENT
 * Note: Utilisation de :patientId pour matcher le controller
 */
router.patch(
    '/:patientId',
    authorize(['Hospital Admin', 'Doctor']),
    (req: Request, res: Response, next: NextFunction) => patientController.updatePatient(req as any, res, next)
);

/**
 * SUPPRIMER UN PATIENT
 * Note: Utilisation de :patientId pour matcher le controller
 */
router.delete(
    '/:patientId',
    authorize(['Hospital Admin', 'Super Admin']),
    (req: Request, res: Response, next: NextFunction) => patientController.deletePatient(req as any, res, next)
);

export default router;