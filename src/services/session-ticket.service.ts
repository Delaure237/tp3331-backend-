import { models } from '../models';
import { NotFoundError, InternalServerError } from '../shared/errors/custom.error';

export class SessionTicketService {
  /**
   * Créer un nouveau ticket de session (Ouverture de la visite)
   */
  public async createTicket(data: { patientId: string; hospitalId: string }) {
    try {
      return await (models.SessionTicket as any).create({
        patientId: data.patientId,
        hospitalId: data.hospitalId,
        totalAmount: 0, // Initialement à 0
        status: 'PENDING',
        ticketDate: new Date()
      });
    } catch (error) {
      throw new InternalServerError("Impossible d'ouvrir la session du patient.");
    }
  }

  /**
   * Récupérer le détail complet pour la facturation/pharmacie
   * C'est ici qu'on fait les jointures (Include)
   */
  public async getTicketFullDetail(ticketId: string) {
    try {
      const ticket = await (models.SessionTicket as any).findByPk(ticketId, {
        include: [
          {
            model: models.MedicalAct,
            as: 'medicalActs',
            include: [
              {
                model: models.Operation,
                as: 'operation',
                attributes: ['operation_name', 'price'] // Pour afficher le nom de l'acte
              }
            ]
          },
          {
            model: models.Patient,
            as: 'patient',
            attributes: ['firstName', 'lastName']
          }
        ]
      });

      if (!ticket) throw new NotFoundError("Ticket de session introuvable.");
      return ticket;
    } catch (error) {
      if (error instanceof NotFoundError) throw error;
      throw new InternalServerError("Erreur lors de la récupération des détails du ticket.");
    }
  }
}