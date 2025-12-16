// src/auth/middleware/upload.middleware.ts

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configuration du répertoire d'uploads
const rootDir = path.resolve(__dirname, '../../..');
const uploadDir = path.join(rootDir, 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuration du stockage de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

// Filtre pour autoriser uniquement les images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        /**
         * CORRECTION ICI :
         * Au lieu de passer 'false' en deuxième argument, on passe l'erreur
         * directement dans le premier argument.
         * On utilise "as any" si TypeScript bloque toujours sur le type de l'erreur.
         */
        cb(new Error('Only image files are allowed!') as any, false);
    }
};

/**
 * Middleware d'upload Multer pour la route registerHospital.
 */
export const hospitalUpload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: fileFilter
}).fields([
    { name: 'hospitalLogo', maxCount: 1 },
    { name: 'hospitalImages', maxCount: 5 }
]);