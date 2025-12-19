// src/config/database.ts

import { Sequelize } from 'sequelize';
import logger from '../utils/logger';
import dotenv from 'dotenv';

dotenv.config();

// Vérification précoce des variables d'environnement cruciales
if (!process.env.DB_NAME || !process.env.DB_USER || !process.env.DB_PASSWORD || !process.env.DB_HOST) {
    throw new Error("Missing critical database environment variables (DB_NAME, DB_USER, DB_PASSWORD, DB_HOST). Please check your .env file.");
}

export const sequelize = new Sequelize({
    dialect: 'postgres',
    // ➡️ Utilisation de l'opérateur `!` pour garantir à TypeScript que les valeurs ne sont pas null/undefined
    host: process.env.DB_HOST!,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USER!,
    password: process.env.DB_PASSWORD!,
    database: process.env.DB_NAME!,

    // Reste de la configuration (inchangé)
    logging: (msg) => logger.debug(msg),
    define: {
        underscored: true,
        timestamps: true,
        freezeTableName: true
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

/**
 * Tente d'établir une connexion à la base de données.
 * Cette fonction ne synchronise PAS les modèles, elle ne fait que se connecter.
 */
export async function connectDB(): Promise<void> {
    try {
        await sequelize.authenticate();
        logger.info('PostgreSQL connection has been established successfully.');
    } catch (error) {
        logger.error('Unable to connect to the database PostgreSQL:', error);
        console.error(error);
        process.exit(1);
    }
}

/**
 * Synchronise tous les modèles Sequelize avec la base de données.
 * ATTENTION: Utilisez `force: true` uniquement en développement car cela supprime et recrée les tables.
 * Utilisez les migrations pour la production. `alter: true` est plus sûr mais aussi à utiliser avec précaution.
 */
// src/config/database.ts

export async function syncDbModels(): Promise<void> {
    try {
        // ➡️ MODIFICATION : Utilisez 'alter' au lieu de 'force'
        await sequelize.sync({ alter: true });

        logger.info('Sequelize models synchronized successfully (data preserved).');
    } catch (error) {
        logger.error('Error synchronizing Sequelize models:', error);
        console.error(error);
        process.exit(1);
    }
}

// Exportez l'instance sequelize
// export { sequelize }; // Déjà exporté ci-dessus