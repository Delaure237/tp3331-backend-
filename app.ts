// app.ts

import express, { type Request, type Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import { connectDB, syncDbModels } from './config/database';
import { initializeModels, associateModels, sequelize, models } from './src/models/index';
import { CustomError } from './src/shared/errors/custom.error';
import authRoutes from './src/auth/routes/auth.route';
import appointmentRoutes from './src/routes/appointment.route';
import patientRoutes from './src/routes/patient.route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3050;


app.use(cors({
    origin: 'http://localhost:4000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// Initialisation des modèles
try {
    initializeModels(sequelize);
    associateModels(models);
    console.log('✅ Modèles Sequelize initialisés et associés.');
} catch (error) {
    console.error('Erreur lors de l\'initialisation des modèles:', error);
    process.exit(1);
}

// Routes de base
app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Le serveur Express fonctionne correctement !',
        status: 'OK'
    });
});

// Routes API
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/appointments', appointmentRoutes);
app.use('/api/v1/patients', patientRoutes);

// 3. GESTION D'ERREUR AMÉLIORÉE
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    // Gestion des erreurs AuthError (qui héritent de CustomError ou ont statusCode)
    const statusCode = err.statusCode || err.status || 500;
    const errorCode = err.errorCode || 'SERVER_ERROR';

    if (err instanceof CustomError) {
        return res.status(statusCode).json({
            status: 'error',
            errorCode: errorCode,
            message: err.message,
            errors: (err as any).serializeErrors ? (err as any).serializeErrors() : undefined,
        });
    }

    console.error('❌ Erreur:', err);
    res.status(statusCode).json({
        status: 'error',
        errorCode: errorCode,
        message: err.message || "Une erreur inattendue s'est produite.",
        details: process.env.NODE_ENV === 'development' ? err : undefined,
    });
});

const startServer = async () => {
    try {
        await connectDB();
        await syncDbModels();

        app.listen(PORT, () => {
            console.log(`⚡️ [server]: Backend sur http://localhost:${PORT}`);
            console.log(`🚀 [frontend]: Autorisé sur http://localhost:5000`);
        });

    } catch (error) {
        console.error('Impossible de démarrer l\'application :', error);
        process.exit(1);
    }
};

startServer();