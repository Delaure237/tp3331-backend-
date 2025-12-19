import express, { type Request, type Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import { connectDB, syncDbModels } from './config/database';
import { initializeModels, associateModels, sequelize, models } from './src/models/index';
import { CustomError } from './src/shared/errors/custom.error';

// Import des routes existantes
import authRoutes from './src/auth/routes/auth.route';
import patientRoutes from './src/routes/patient.route';
import hospitalRoutes from './src/routes/hospital.route';
import doctorRoutes from './src/routes/doctor.route';

// ✅ Import de la nouvelle route de booking
import bookingRoutes from './src/routes/booking.route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3050;

// Configuration CORS
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = ['http://localhost:4000', 'http://127.0.0.1:4000', 'http://localhost:3000'];
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'X-Requested-With'],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// ✅ RENDRE LE DOSSIER UPLOADS ACCESSIBLE
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Initialisation des modèles
try {
    initializeModels(sequelize);
    associateModels(models);
    console.log('Modèles Sequelize initialisés.');
} catch (error) {
    console.error('Erreur initialisation modèles:', error);
    process.exit(1);
}

// Routes API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/patients', patientRoutes);
app.use('/api/v1/hospitals', hospitalRoutes);
app.use('/api/v1/doctors', doctorRoutes);
app.use('/api/v1/bookings', bookingRoutes);

// Gestion d'erreur centralisée
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        status: 'error',
        message: err.message || "Erreur serveur",
    });
});

const startServer = async () => {
    try {
        await connectDB();
        await syncDbModels();
        app.listen(PORT, () => console.log(`⚡️ [server]: Backend sur http://localhost:${PORT}`));
    } catch (error) {
        process.exit(1);
    }
};

startServer();