import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';

export class BookingController {
    private bookingService: BookingService;

    constructor() {
        this.bookingService = new BookingService();
    }

    public getBookingSetupData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { hospitalId } = req.params;

            // Validation stricte pour TypeScript
            if (!hospitalId) {
                res.status(400).json({
                    status: 'error',
                    message: "L'identifiant de l'hôpital est manquant dans l'URL."
                });
                return;
            }

            console.log("Recherche de catalogue pour l'hôpital ID:", hospitalId);

            // Ici, hospitalId est garanti d'être une string grâce au check ci-dessus
            const services = await this.bookingService.getHospitalCatalog(hospitalId);
            console.log(`Services trouvés: ${services.length}`);

            const doctors = await this.bookingService.getAllHospitalDoctors(hospitalId);
            console.log(`Docteurs trouvés: ${doctors.length}`);

            res.status(200).json({
                services,
                doctors
            });
        } catch (error) {
            next(error);
        }
    };
}