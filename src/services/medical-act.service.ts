// backend/src/services/medical-act.service.ts
import { models } from '../models';

export class MedicalActService {
    public async addActToTicket(sessionId: string, operationId: string) {
        // 1. On récupère l'opération pour avoir le prix officiel
        const operation = await (models.Operation as any).findByPk(operationId);
        if (!operation) throw new Error("Opération non trouvée au catalogue");

        // 2. On crée l'acte médical lié au ticket de session

        return await (models.MedicalAct as any).create({
            sessionId: sessionId,
            operationId: operationId,
            cost: operation.price,
            date: new Date(),
            paymentId: null
        });
    }
}