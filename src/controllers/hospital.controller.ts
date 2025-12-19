import { Request, Response, NextFunction } from 'express';
import { HospitalService, HospitalFilters } from '../services/hospital.service';

export class HospitalController {
    private hospitalService: HospitalService;

    constructor() {
        this.hospitalService = new HospitalService();
    }

    /**
     * Crée ou met à jour un service et ses opérations (Find or Create)
     */
    public createFullServiceCatalogue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitalId = (req.params.hospitalId as string) || (req as any).user?.hospitalId;
            const { name, description, operations } = req.body;

            if (!hospitalId || !name || !Array.isArray(operations)) {
                res.status(400).json({ message: "Données manquantes : hospitalId, nom du service et opérations requis." });
                return;
            }

            const result = await this.hospitalService.createFullService(hospitalId, {
                name,
                description,
                operations
            });
            res.status(200).json(result);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Récupère un hôpital par son ID (C'est la méthode qui manquait)
     */
    public getHospitalById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { hospitalId } = req.params;
            if (!hospitalId) {
                res.status(400).json({ message: "L'identifiant de l'établissement est requis." });
                return;
            }
            const hospital = await this.hospitalService.getHospitalById(hospitalId);
            res.status(200).json(hospital);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Récupère les services et opérations d'un hôpital (pour le Step 1)
     */
    public getHospitalServices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { hospitalId } = req.params;
            if (!hospitalId) {
                res.status(400).json({ message: "L'identifiant de l'établissement est requis." });
                return;
            }
            const data = await this.hospitalService.getHospitalServices(hospitalId);
            res.status(200).json(data);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Supprime une opération spécifique
     */
    public deleteOperation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { operationId } = req.params;
            if (!operationId) {
                res.status(400).json({ message: "L'identifiant de l'opération est requis." });
                return;
            }
            await this.hospitalService.deleteOperation(operationId);
            res.status(200).json({ message: "Opération supprimée avec succès." });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Liste tous les hôpitaux avec filtres
     */
    public getAllHospitals = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const filters: HospitalFilters = {
                search: req.query.search as string,
                city: req.query.city as string
            };
            const hospitals = await this.hospitalService.getAllHospitals(filters);
            res.status(200).json(hospitals);
        } catch (error) {
            next(error);
        }
    };

    /**
     * Stats rapides pour le dashboard
     */
    public getQuickStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const hospitalId = (req.params.hospitalId as string) || (req as any).user?.hospitalId;
            const stats = await this.hospitalService.getHospitalQuickStats(hospitalId);
            res.status(200).json(stats);
        } catch (error) {
            next(error);
        }
    };
}