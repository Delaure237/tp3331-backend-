import { Router } from 'express';

import { authenticate } from '../auth/middlewares/auth.middleware';
import { authorize } from '../auth/middlewares/authorize.middleware';
import { AppointmentController } from '../controllers/appointment.controller';

const router = Router();
const appointmentController = new AppointmentController();

/**
 * Note : On utilise 'as any' pour les middlewares et méthodes du contrôleur.
 * Cela permet d'accepter l'objet 'req.user' injecté par l'authentification
 * sans entrer en conflit avec le type Request de base d'Express.
 */

// Appliquer l'authentification à toutes les routes
router.use(authenticate as any);

// --- 1. Statistiques ---
router.get(
    '/stats',
    authorize(['Hospital Admin', 'Doctor']) as any,
    appointmentController.getAppointmentStats as any
);

// --- 2. Création et Listing ---
router.post(
    '/',
    authorize(['Hospital Admin', 'Doctor']) as any,
    appointmentController.createAppointment as any
);

router.get(
    '/',
    authorize(['Hospital Admin', 'Doctor', 'Patient']) as any,
    appointmentController.getAppointments as any
);

// --- 3. CRUD Spécifique ---
router.get(
    '/:id',
    authorize(['Hospital Admin', 'Doctor', 'Patient']) as any,
    appointmentController.getAppointmentById as any
);

router.patch(
    '/:id',
    authorize(['Hospital Admin', 'Doctor']) as any,
    appointmentController.updateAppointment as any
);

router.delete(
    '/:id',
    authorize(['Hospital Admin']) as any,
    appointmentController.deleteAppointment as any
);

export default router;