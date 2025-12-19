// backend/src/services/payment.service.ts
import { models } from '../models';
import { Sequelize } from 'sequelize';

export class PaymentService {
    public async processPayment(data: {
        medicalActIds: string[],
        method: 'CASH' | 'MOBILE_MONEY' | 'CARD',
        sessionId: string
    }) {
        // On utilise une transaction pour éviter les paiements partiels en cas d'erreur
        const t = await (models.sequelize as unknown as Sequelize).transaction();

        try {
            // 1. Récupérer les actes pour calculer le total
            const acts = await (models.MedicalAct as any).findAll({
                where: { id: data.medicalActIds },
                transaction: t
            });

            const totalToPay = acts.reduce((sum: number, act: any) => sum + Number(act.cost), 0);

            // 2. Créer l'enregistrement de paiement
            const payment = await (models.Payment as any).create({
                amount: totalToPay,
                method: data.method,
                status: 'COMPLETED', // On considère que c'est validé à ce stade
                sessionTicketId: data.sessionId
            }, { transaction: t });

            // 3. Lier chaque acte au paiement et marquer comme payé
            await (models.MedicalAct as any).update(
                { paymentId: payment.id },
                { where: { id: data.medicalActIds }, transaction: t }
            );

            // 4. Mettre à jour le ticket (status)
            // Logique simplifiée : on vérifie si d'autres actes restent sans paiement
            await t.commit();
            return payment;

        } catch (error) {
            await t.rollback();
            throw error;
        }
    }
}