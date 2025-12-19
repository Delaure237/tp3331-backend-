import { models } from '../models';
import { NotFoundError, InternalServerError } from '../shared/errors/custom.error';

export class OperationService {

    // Créer un nouvel acte tarifé
    public async createOperation(data: { name: string, price: number, serviceId: string }) {
        try {
            return await (models.Operation as any).create(data);
        } catch (error) {
            throw new InternalServerError("Impossible de créer l'opération.");
        }
    }

    // UPDATE : Modifier le prix ou le nom d'un acte existant
    public async updateOperation(id: string, data: { name?: string, price?: number }) {
        try {
            const operation = await (models.Operation as any).findByPk(id);
            if (!operation) throw new NotFoundError("Cet acte n'existe pas dans le catalogue.");

            // On met à jour uniquement les champs fournis
            return await operation.update(data);
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new InternalServerError("Erreur lors de la mise à jour de l'acte.");
        }
    }

    // Récupérer le catalogue par service (pour l'affichage UI)
    public async getCatalogueByService(serviceId: string) {
        return await (models.Operation as any).findAll({
            where: { serviceId },
            order: [['operation_name', 'ASC']]
        });
    }

    // DELETE : Supprimer un acte du catalogue (Attention : seulement si jamais utilisé)
    public async deleteOperation(id: string) {
        const operation = await (models.Operation as any).findByPk(id);
        if (!operation) throw new NotFoundError("Opération introuvable.");

        // Sequelize bloquera automatiquement si des MedicalActs y sont liés
        // grâce à onDelete: 'RESTRICT' dans ton modèle.
        return await operation.destroy();
    }
}