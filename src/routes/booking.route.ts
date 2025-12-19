import { Router, Request, Response, NextFunction } from 'express';
import { BookingController } from '../controllers/booking.controller';
import { authenticate } from '../auth/middlewares/auth.middleware';
import { authorize } from '../auth/middlewares/authorize.middleware';

const router = Router();
const bookingController = new BookingController();

/**
 * PROTECTION GLOBALE
 * On authentifie l'utilisateur pour toutes les étapes du booking
 */
router.use(authenticate as any);

/**
 * RÉCUPÉRER LE CATALOGUE DE RÉSERVATION (Step 1)
 * Accessible par tous les rôles authentifiés pour permettre la prise de RDV
 * Route: GET /api/bookings/setup/:hospitalId
 */
router.get(
    '/setup/:hospitalId',
    authorize(['Hospital Admin', 'Patient', 'Doctor', 'Super Admin']),
    (req: Request, res: Response, next: NextFunction) =>
        bookingController.getBookingSetupData(req, res, next)
);

/**
 * RÉCUPÉRER LES CRÉNEAUX DISPONIBLES (Step 2 - À venir)
 * Route: GET /api/bookings/slots/:doctorId
 */
// router.get('/slots/:doctorId', ...);

/**
 * CRÉER LA RÉSERVATION FINALE (Step 3 - À venir)
 * Route: POST /api/bookings
 */
// router.post('/', ...);

export default router;