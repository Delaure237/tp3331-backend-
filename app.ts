import express, {  type Request, type Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());


app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
        message: 'Le serveur Express fonctionne correctement !',
        status: 'OK',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Démarrage du serveur
app.listen(PORT, () => {
    console.log(`⚡️ [server]: Le serveur tourne sur http://localhost:${PORT}`);
    console.log(`Base de données: ${process.env.DB_NAME || 'Non configurée'}`);
});