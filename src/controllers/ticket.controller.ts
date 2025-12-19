// backend/src/controllers/ticket.controller.ts
import { Request, Response } from 'express';
import { MedicalActService } from '../services/medical-act.service';
import { SessionTicketService } from '../services/session-ticket.service';


const medicalActService = new MedicalActService();
const sessionTicketService = new SessionTicketService();

export const TicketController = {
  /**
   * Ajouter un acte (ex: consultation, radio) à un ticket existant
   */
  async addAct(req: Request, res: Response) {
    try {
      const { sessionId, operationId } = req.body;

      // Correction des erreurs TS : Validation de présence
      if (!sessionId || !operationId) {
        return res.status(400).json({
          error: "Le sessionId et l'operationId sont obligatoires pour ajouter un acte."
        });
      }

      const act = await medicalActService.addActToTicket(sessionId, operationId);
      return res.status(201).json(act);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  },

  /**
   * Récupérer le ticket avec tous ses actes (payés ou non)
   * Utile pour la caisse et la pharmacie
   */
  async getDetail(req: Request, res: Response) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: "L'identifiant du ticket est requis." });
      }

      // On appelle le service qui va inclure les MedicalActs et leurs statuts de paiement
      const ticket = await sessionTicketService.getTicketFullDetail(id);

      if (!ticket) {
        return res.status(404).json({ error: "Ticket introuvable." });
      }

      return res.json(ticket);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
};