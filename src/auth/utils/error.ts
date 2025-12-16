
/**
 * Classe d'erreur personnalisée pour la gestion des erreurs de l'application.
 * Permet d'inclure un code d'erreur interne et un statut HTTP.
 */
export class AppError extends Error {
    public code: string;
    public statusCode: number;
    public details?: any;

    constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode: number = 500, details?: any) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        // Permet de capturer la pile d'appels pour un meilleur débogage
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Classe d'erreur spécifique pour les problèmes d'authentification.
 * Étend AppError avec des codes d'erreur spécifiques à l'authentification.
 */
export class AuthError extends AppError {
    constructor(message: string, code: string = 'AUTH_ERROR', statusCode: number = 401, details?: any) {
        super(message, code, statusCode, details);
        this.name = 'AuthError';
    }
}

/**
 * Classe d'erreur pour les ressources non trouvées.
 */
export class NotFoundError extends AppError {
    constructor(message: string = 'Resource not found.', code: string = 'NOT_FOUND', statusCode: number = 404, details?: any) {
        super(message, code, statusCode, details);
        this.name = 'NotFoundError';
    }
}

/**
 * Classe d'erreur pour les requêtes mal formées.
 */
export class BadRequestError extends AppError {
    constructor(message: string = 'Bad request.', code: string = 'BAD_REQUEST', statusCode: number = 400, details?: any) {
        super(message, code, statusCode, details);
        this.name = 'BadRequestError';
    }
}

/**
 * Classe d'erreur pour les accès interdits (permissions insuffisantes).
 */
export class ForbiddenError extends AppError {
    constructor(message: string = 'Forbidden.', code: string = 'FORBIDDEN', statusCode: number = 403, details?: any) {
        super(message, code, statusCode, details);
        this.name = 'ForbiddenError';
    }
}


/**
 * Classe d'erreur pour les conflits de données (ex: ressource déjà existante).
 */
export class ConflictError extends AppError {
    constructor(message: string = 'Conflict.', code: string = 'CONFLICT', statusCode: number = 409, details?: any) {
        super(message, code, statusCode, details);
        this.name = 'ConflictError';
    }
}

/**
 * Classe d'erreur pour les accès non autorisés (manque d'authentification).
 * Similaire à AuthError, mais souvent utilisée quand aucune authentification n'est fournie.
 * Peut être fusionnée avec AuthError si les cas d'usage sont trop similaires.
 */
export class UnauthorizedError extends AppError {
    constructor(message: string = 'Unauthorized.', code: string = 'UNAUTHORIZED', statusCode: number = 401, details?: any) {
        super(message, code, statusCode, details);
        this.name = 'UnauthorizedError';
    }
}