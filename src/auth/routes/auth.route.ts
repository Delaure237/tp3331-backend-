// src/auth/routes/auth.routes.ts

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
 * Utilise hospitalUpload pour gérer les logos et images
 */
router.post('/signup/hospital', hospitalUpload, AuthController.registerHospital as RequestHandler);


// ----------------------------------------------------------------------
// 2. Routes de Connexion et Mots de Passe (Ouvertes - Publiques)
// ----------------------------------------------------------------------

/**
 * @route POST /api/v1/auth/login
 */
router.post('/login', AuthController.login as RequestHandler);

/**
 * @route POST /api/v1/auth/forgot-password
 */
router.post('/forgot-password', AuthController.forgotPassword as RequestHandler);

/**
 * @route POST /api/v1/auth/reset-password
 */
router.post('/reset-password', AuthController.resetPassword as RequestHandler);


// ----------------------------------------------------------------------
// 3. Routes Protégées (Nécessitent authenticate)
// Le middleware 'authenticate' remplit req.user, indispensable pour ces routes.
// ----------------------------------------------------------------------

/**
 * @route GET /api/v1/auth/me
 * Récupère le profil de l'utilisateur connecté
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
// 4. Routes Protégées et Autorisées (Rôles Spécifiques)
// ----------------------------------------------------------------------

/**
 * @route POST /api/v1/auth/staff/create
 * Seul un Admin d'Hôpital peut créer du personnel (Docteurs, etc.)
 */
router.post(
    '/staff/create',
    authenticate as RequestHandler,
    authorize(['Hospital Admin']) as RequestHandler,
    AuthController.createStaffUser as RequestHandler
);

export default router;