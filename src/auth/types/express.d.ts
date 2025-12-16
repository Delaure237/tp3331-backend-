
import { Request } from 'express';
import { JwtPayload } from '../utils/jwt';


declare module 'express' {
    export interface Request {
        userId?: string | null;
        userEmail?: string ;
        pharmacyId?: string | null;
        roles?: string[];
    }
}