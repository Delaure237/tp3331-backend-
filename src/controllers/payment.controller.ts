// backend/src/controllers/payment.controller.ts
import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';

const paymentService = new PaymentService();

export const PaymentController = {
  /**
   * Encaisser une liste d'actes (Caisse physique ou retour de paiement en ligne)
   */
  async pay(req: Request, res: Response) {
    try {
      const { medicalActIds, method, sessionId } = req.body;

      // 1. Validation de présence (Évite l'erreur TS 'undefined')
      if (!medicalActIds || !Array.isArray(medicalActIds) || medicalActIds.length === 0) {
        return res.status(400).json({ error: "Une liste d'identifiants d'actes est requise." });
      }

      if (!method || !sessionId) {
        return res.status(400).json({ error: "Le mode de paiement et le sessionId sont requis." });
      }

      // 2. Logique de paiement
      // TODO: Si method === 'MOBILE_MONEY' et source === 'ONLINE', intégrer Campay ici.
      // Pour l'instant, on traite tout comme un encaissement validé.

      const payment = await paymentService.processPayment({
        medicalActIds,
        method, // 'CASH' | 'MOBILE_MONEY' | 'CARD'
        sessionId
      });

      return res.status(201).json({
        message: "Paiement enregistré avec succès",
        data: payment
      });

    } catch (error: any) {
      console.error("Erreur Paiement:", error);
      return res.status(500).json({ error: error.message });
    }
  }
};