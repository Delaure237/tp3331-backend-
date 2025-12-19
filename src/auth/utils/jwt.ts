import jwt from 'jsonwebtoken';

// ⚠️ IMPORTANT : Assurez-vous que cette clé est la même que dans votre .env
const JWT_SECRET = process.env.JWT_SECRET || 'votre_cle_secrete_de_developpement';
const JWT_EXPIRATION = '7d';

export interface JwtPayload {
    userId: string;
    email: string;
    hospitalId: string | null; 
    roles: string[];
}

/**
 * Génère un token proprement structuré pour le domaine hospitalier
 */
export const generateJwtToken = (payload: JwtPayload): string => {
    // On signe l'objet payload directement
    return jwt.sign(
        {
            userId: payload.userId,
            email: payload.email,
            hospitalId: payload.hospitalId,
            roles: payload.roles
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRATION }
    );
};

/**
 * Vérifie le token et retourne le payload typé
 */
export const verifyJwtToken = (token: string): JwtPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // On reconstruit l'objet pour être sûr d'avoir les bons champs
        return {
            userId: decoded.userId,
            email: decoded.email,
            hospitalId: decoded.hospitalId || null,
            roles: Array.isArray(decoded.roles) ? decoded.roles : []
        };
    } catch (err) {
        return null;
    }
};