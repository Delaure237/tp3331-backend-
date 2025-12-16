
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_that_is_long_and_random';
const JWT_EXPIRATION = '7d';

export interface JwtPayload {
    userId: string;
    email: string;
    hospitalId: string | null | undefined;
    roles: string[];
}

export const generateJwtToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });
};

export const verifyJwtToken = (token: string): JwtPayload | null => {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        return decoded;
    } catch (err) {
        return null;
    }
};