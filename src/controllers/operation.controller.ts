// backend/src/controllers/operation.controller.ts
import { Request, Response } from 'express';
import { OperationService } from '../services/operation.service';

const operationService = new OperationService();

export const OperationController = {
  /**
   * Créer un acte dans un service
   */
  async create(req: Request, res: Response) {
    try {
      // Extraction et validation minimale
      const { name, price, serviceId } = req.body;

      if (!name || price === undefined || !serviceId) {
        return res.status(400).json({ error: "Les champs name, price et serviceId sont requis." });
      }

      const operation = await operationService.createOperation({ name, price, serviceId });
      return res.status(201).json(operation);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * Mettre à jour un prix ou un nom
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      // Correction de l'erreur TS : Vérification que l'id existe
      if (!id) {
        return res.status(400).json({ error: "L'identifiant de l'opération est requis." });
      }

      const updated = await operationService.updateOperation(id, req.body);
      return res.json(updated);
    } catch (error: any) {
      // Gestion spécifique si l'id n'existe pas en base
      const status = error.name === 'NotFoundError' ? 404 : 500;
      return res.status(status).json({ error: error.message });
    }
  },

  /**
   * Lister le catalogue d'un service
   */
  async getByService(req: Request, res: Response) {
    try {
      const { serviceId } = req.params;

      // Correction de l'erreur TS : Vérification que le serviceId existe
      if (!serviceId) {
        return res.status(400).json({ error: "L'identifiant du service est requis." });
      }

      const list = await operationService.getCatalogueByService(serviceId);
      return res.json(list);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
};