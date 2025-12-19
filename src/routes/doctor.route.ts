import { Router, Request, Response, NextFunction } from 'express';
import { DoctorController } from '../controllers/doctor.controller';
import { authorize } from '../auth/middlewares/authorize.middleware';
import { authenticate } from '../auth/middlewares/auth.middleware';

const router = Router();
const doctorController = new DoctorController();

// Protection globale de la route
router.use(authenticate as any);

/**
 * CRÉER UN DOCTEUR
 */
router.post(
    '/',
    authorize(['Hospital Admin']),
    (req: Request, res: Response, next: NextFunction) => doctorController.createDoctor(req as any, res, next)
);

/**
 * LISTE DES DOCTEURS (Recherche & Pagination)
 */
router.get(
    '/',
    authorize(['Hospital Admin', 'Super Admin', 'Doctor']),
    (req: Request, res: Response, next: NextFunction) => doctorController.getDoctors(req as any, res, next)
);

/**
 * RÉCUPÉRER UN DOCTEUR PAR ID
 */
router.get(
    '/:doctorId',
    authorize(['Hospital Admin', 'Super Admin', 'Doctor']),
    (req: Request, res: Response, next: NextFunction) => doctorController.getDoctorById(req as any, res, next)
);

/**
 * METTRE À JOUR UN DOCTEUR
 */
router.patch(
    '/:doctorId',
    authorize(['Hospital Admin']),
    (req: Request, res: Response, next: NextFunction) => doctorController.updateDoctor(req as any, res, next)
);

/**
 * SUPPRIMER UN DOCTEUR
 */
router.delete(
    '/:doctorId',
    authorize(['Hospital Admin', 'Super Admin']),
    (req: Request, res: Response, next: NextFunction) => doctorController.deleteDoctor(req as any, res, next)
);

export default router;