import { col, fn, Op } from 'sequelize';
import { models, sequelize } from '../models';
import { InternalServerError, NotFoundError } from '../shared/errors/custom.error';

export interface HospitalFilters {
    search?: string;
    city?: string;
}

export class HospitalService {

    /**
     * Récupère les services d'un hôpital avec leurs opérations (actes)
     */
    public async getHospitalServices(hospitalId: string): Promise<any[]> {
        try {
            const services = await (models.Service as any).findAll({
                where: { hospitalId },
                include: [{
                    model: models.Operation,
                    as: 'operations'
                }],
                order: [['createdAt', 'DESC']]
            });
            return services.map((s: any) => s.get({ plain: true }));
        } catch (error) {
            console.error("GetHospitalServices Error:", error);
            throw new InternalServerError("Erreur lors de la récupération des services.");
        }
    }

    /**
     * Crée ou récupère un service et lui ajoute des opérations (sans doublons de service)
     */
    public async createFullService(hospitalId: string, data: {
        name: string,
        description?: string,
        operations: { name: string, price: number }[]
    }): Promise<any> {
        const t = await sequelize.transaction();
        try {
            // 1. Recherche ou Création du service (Normalisation du nom en minuscule pour le check)
            const [service] = await (models.Service as any).findOrCreate({
                where: {
                    name: data.name.toLowerCase(),
                    hospitalId: hospitalId
                },
                defaults: {
                    name: data.name.toLowerCase(),
                    description: data.description || null,
                    hospitalId: hospitalId,
                    price: 0
                },
                transaction: t
            });

            // 2. Ajout des opérations (on ignore celles qui existent déjà via l'index unique)
            if (data.operations?.length > 0) {
                const operationsToCreate = data.operations.map(op => ({
                    name: op.name,
                    price: op.price,
                    serviceId: service.id
                }));

                await (models.Operation as any).bulkCreate(operationsToCreate, {
                    transaction: t,
                    ignoreDuplicates: true
                });
            }

            const result = await (models.Service as any).findByPk(service.id, {
                include: [{ model: models.Operation, as: 'operations' }],
                transaction: t
            });

            await t.commit();
            return result.get({ plain: true });
        } catch (error) {
            if (t) await t.rollback();
            throw new InternalServerError("Erreur lors de la création du catalogue.");
        }
    }

    /**
     * Supprime une opération spécifique (acte médical)
     */
    public async deleteOperation(operationId: string): Promise<void> {
        try {
            const deletedCount = await (models.Operation as any).destroy({
                where: { id: operationId }
            });

            if (deletedCount === 0) {
                throw new NotFoundError("L'acte médical n'existe pas.");
            }
        } catch (error) {
            if (error instanceof NotFoundError) throw error;
            throw new InternalServerError("Erreur lors de la suppression de l'acte.");
        }
    }

    // ... autres méthodes (getAllHospitals, getHospitalQuickStats, etc.) restent identiques
    public async getHospitalById(hospitalId: string): Promise<any> {
        const hospital = await (models.Hospital as any).findByPk(hospitalId, {
            include: [{
                model: models.Service,
                as: 'servicesProvided',
                include: [{ model: models.Operation, as: 'operations' }]
            }]
        });
        if (!hospital) throw new NotFoundError("Établissement non trouvé.");
        return hospital.get({ plain: true });
    }

    public async getHospitalQuickStats(hospitalId: string): Promise<any> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [doctors, patients, appointments] = await Promise.all([
            (models.Doctor as any).count({ where: { hospitalId } }),
            (models.Patient as any).count({ where: { hospitalId } }),
            (models.Appointment as any).count({ where: { hospitalId, startTime: { [Op.gte]: today } } })
        ]);
        return { doctors, patients, todayAppointments: appointments };
    }

  public async getAllHospitals(filters: HospitalFilters = {}): Promise<any[]> {
    const { search, city } = filters;
    const whereClause: any = {};

    try {
        if (search) {
            whereClause[Op.or] = [
                // On utilise hospitalName car c'est ce qui semble être dans votre modèle
                { hospitalName: { [Op.iLike]: `%${search}%` } },
                { address: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const hospitals = await (models.Hospital as any).findAll({
            where: whereClause,
            include: [{
                model: models.Service,
                as: 'servicesProvided',
                include: [{ model: models.Operation, as: 'operations' }]
            }],
            order: [['hospitalName', 'ASC']],
        });

        // LOG DE SECOURS : Pour voir exactement ce que Sequelize sort de la base
        if (hospitals.length > 0) {
            console.log("BACKEND - Premier hôpital trouvé (colonnes brutes):", Object.keys(hospitals[0].dataValues));
        }

        return hospitals.map((h: any) => h.get({ plain: true }));
    } catch (error: any) {
        console.error("BACKEND ERROR - getAllHospitals:", error.message);
        throw new InternalServerError(`Erreur SQL: ${error.message}`);
    }
}
}