import Service from '../models/service';
import Operation from '../models/operation';
import Doctor from '../models/doctor';

export class BookingService {
    /**
     * Récupère les services et leurs opérations associées
     */
    async getHospitalCatalog(hospitalId: string) {
        console.log(`\n[DEBUG BACKEND] --- Requête Catalogue ---`);
        console.log(`[DEBUG BACKEND] ID recherché: ${hospitalId}`);

        try {
            const services = await Service.findAll({
                where: { hospitalId },
                include: [{
                    model: Operation,
                    as: 'operations',
                    attributes: ['id', 'name', 'price']
                }]
            });

            console.log(`[DEBUG BACKEND] Résultat: ${services.length} services trouvés.`);

            // Correction de l'erreur TS2532 avec l'optional chaining ?.
            if (services && services.length > 0) {
                console.log(`[DEBUG BACKEND] Exemple de service:`, services[0]?.get({ plain: true }));
            } else {
                // Verification si le problème vient du nom de la colonne
                const oneSample = await Service.findOne();
                if (oneSample) {
                    console.log(`[DEBUG BACKEND] INFO: La table n'est pas vide. Structure d'un objet en base:`, oneSample.get({ plain: true }));
                }
            }

            return services;
        } catch (error: any) {
            console.error(`[DEBUG BACKEND] ERREUR SQL Services:`, error.message);
            throw error;
        }
    }

    /**
     * Récupère tous les docteurs d'un hôpital
     */
    async getAllHospitalDoctors(hospitalId: string) {
        try {
            const doctors = await Doctor.findAll({
                where: { hospitalId },
                attributes: ['id', 'firstName', 'lastName', 'specialty']
            });
            console.log(`[DEBUG BACKEND] Résultat: ${doctors.length} docteurs trouvés.`);
            return doctors;
        } catch (error: any) {
            console.error(`[DEBUG BACKEND] ERREUR SQL Docteurs:`, error.message);
            throw error;
        }
    }

    /**
     * Centralise les données pour le contrôleur
     */
    async getBookingSetupData(hospitalId: string) {
        const [services, doctors] = await Promise.all([
            this.getHospitalCatalog(hospitalId),
            this.getAllHospitalDoctors(hospitalId)
        ]);

        return { services, doctors };
    }
}