import type { Request, Response, NextFunction } from 'express';

const sanitizeString = (value: string): string => {
    return value
        .replace(/[\t\r\n]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};


const sanitizeObject = (obj: unknown): unknown => {
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeObject(item));
    }

    if (obj !== null && typeof obj === 'object') {
        const sanitized: Record<string, unknown> = {};
        for (const key in obj) {
            sanitized[key] = sanitizeObject((obj as Record<string, unknown>)[key]);
        }
        return sanitized;
    }

    return obj;
};

export const sanitizeInputMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }

    if (req.query) {
        req.query = sanitizeObject(req.query) as typeof req.query;
    }

    if (req.params) {
        req.params = sanitizeObject(req.params) as typeof req.params;
    }

    next();
};
