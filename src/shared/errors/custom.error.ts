// src/shared/errors/custom.error.ts

export abstract class CustomError extends Error {
    constructor(public message: string, public statusCode: number = 500) {
        super(message);
        Object.setPrototypeOf(this, CustomError.prototype);
    }

    abstract serializeErrors(): { message: string; field?: string }[];
}

export class NotFoundError extends CustomError {
    constructor(message: string = 'Resource not found') {
        super(message, 404);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}

export class BadRequestError extends CustomError {
    constructor(message: string = 'Bad request') {
        super(message, 400);
        Object.setPrototypeOf(this, BadRequestError.prototype);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}

export class UnauthorizedError extends CustomError {
    constructor(message: string = 'Unauthorized') {
        super(message, 401);
        Object.setPrototypeOf(this, UnauthorizedError.prototype);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}

export class ForbiddenError extends CustomError {
    constructor(message: string = 'Forbidden') {
        super(message, 403);
        Object.setPrototypeOf(this, ForbiddenError.prototype);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}

export class ConflictError extends CustomError {
    constructor(message: string = 'Conflict: resource already exists or state is invalid') {
        super(message, 409);
        Object.setPrototypeOf(this, ConflictError.prototype);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}

export class InternalServerError extends CustomError {
    constructor(message: string = 'Internal Server Error') {
        super(message, 500);
        Object.setPrototypeOf(this, InternalServerError.prototype);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}

export class ServiceUnavailableError extends CustomError {
    constructor(message: string = 'Service Unavailable') {
        super(message, 503);
        Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
    }

    serializeErrors() {
        return [{ message: this.message }];
    }
}