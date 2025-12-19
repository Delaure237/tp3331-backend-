import { Router, RequestHandler } from 'express';
import AuthController from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/authorize.middleware';
import { hospitalUpload } from '../middlewares/upload.middleware';

const router = Router();

// ----------------------------------------------------------------------
// 1. Routes d'Inscription (Ouvertes - Publiques)
// ----------------------------------------------------------------------

/**
 * @route POST /api/v1/auth/signup/patient
 */
router.post('/signup/patient', AuthController.signUpPatient as RequestHandler);

/**
 * @route POST /api/v1/auth/signup/hospital
 */
router.post('/signup/hospital', hospitalUpload, AuthController.registerHospital as RequestHandler);

// ----------------------------------------------------------------------
// 2. Validation & Authentification (Ouvertes - Publiques)
// ----------------------------------------------------------------------

/**
 * @route POST /api/v1/auth/verify-otp
 * NOUVEAU : Valide l'email et active le compte (pose le cookie JWT)
 */
router.post('/verify-otp', AuthController.verifyOtp as RequestHandler);

/**
 * @route POST /api/v1/auth/login
 */
router.post('/login', AuthController.login as RequestHandler);

/**
 * @route POST /api/v1/auth/logout
 */
router.post('/logout', AuthController.logout as RequestHandler);

// ----------------------------------------------------------------------
// 3. Mots de Passe (Ouvertes - Publiques)
// ----------------------------------------------------------------------

/**
 * @route POST /api/v1/auth/forgot-password
 * Envoie un OTP de réinitialisation
 */
router.post('/forgot-password', AuthController.forgotPassword as RequestHandler);

/**
 * @route POST /api/v1/auth/reset-password
 * Valide l'OTP et change le mot de passe
 */
router.post('/reset-password', AuthController.resetPassword as RequestHandler);


// ----------------------------------------------------------------------
// 4. Routes Protégées (Nécessitent authenticate)
// ----------------------------------------------------------------------

/**
 * @route GET /api/v1/auth/me
 */
router.get(
    '/me',
    authenticate as RequestHandler,
    AuthController.getCurrentUser as RequestHandler
);

/**
 * @route PATCH /api/v1/auth/change-password
 */
router.patch(
    '/change-password',
    authenticate as RequestHandler,
    AuthController.changePassword as RequestHandler
);


// ----------------------------------------------------------------------
// 5. Routes de Gestion (Rôles Spécifiques)
// ----------------------------------------------------------------------

/**
 * @route POST /api/v1/auth/staff/create
 */
router.post(
    '/staff/create',
    authenticate as RequestHandler,
    authorize(['Hospital Admin']) as RequestHandler,
    AuthController.createStaffUser as RequestHandler
);

export default router;