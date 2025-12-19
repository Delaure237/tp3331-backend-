import { Router } from 'express';
import { HospitalController } from '../controllers/hospital.controller';
import { authorize } from '../auth/middlewares/authorize.middleware';
import { authenticate } from '../auth/middlewares/auth.middleware';

const router = Router();
const hospitalController = new HospitalController();

// Protection globale par authentification
router.use(authenticate as any);

// --- ROUTES ---

/**
 * 1. Recherche globale des hôpitaux
 * Utilisé par les patients pour trouver un établissement
 */
router.get(
    '/',
    authorize(['Hospital Admin', 'Doctor', 'Super Admin', 'Patient']),
    (req, res, next) => hospitalController.getAllHospitals(req, res, next)
);

/**
 * 2. Statistiques rapides Dashboard
 */
router.get(
    '/stats/quick',
    authorize(['Hospital Admin', 'Super Admin']),
    (req, res, next) => hospitalController.getQuickStats(req as any, res, next)
);

/**
 * 3. CRÉATION / MISE À JOUR DU CATALOGUE (Service + Opérations)
 * Cette route gère le "Find or Create" du service et l'ajout d'actes
 */
router.post(
    '/services/setup',
    authorize(['Hospital Admin', 'Super Admin']),
    (req, res, next) => hospitalController.createFullServiceCatalogue(req, res, next)
);

/**
 * 4. RÉCUPÉRATION DES SERVICES ET OPÉRATIONS
 * Route cruciale pour le frontend (Step 1 du tunnel ou gestion catalogue)
 */
router.get(
    '/:hospitalId/services',
    authorize(['Hospital Admin', 'Doctor', 'Super Admin', 'Patient']),
    (req, res, next) => hospitalController.getHospitalServices(req, res, next)
);

/**
 * 5. SUPPRESSION D'UNE OPÉRATION (Acte médical)
 * On utilise l'ID de l'opération directement
 */
router.delete(
    '/operations/:operationId',
    authorize(['Hospital Admin', 'Super Admin']),
    (req, res, next) => hospitalController.deleteOperation(req, res, next)
);

/**
 * 6. Détails complets d'un hôpital
 */
router.get(
    '/:hospitalId',
    authorize(['Hospital Admin', 'Doctor', 'Super Admin', 'Patient']),
    (req, res, next) => hospitalController.getHospitalById(req, res, next)
);

export default router;