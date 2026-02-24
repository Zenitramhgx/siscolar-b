import { AppError } from '../middlewares/errorHandler';

export const validateMimeType = (
    fileMimeType: string,
    expectedMimeType: string
): void => {
    if (!fileMimeType || !expectedMimeType) {
        throw new AppError('VALIDATION ERROR', 400);
    }

    if (fileMimeType.trim() !== expectedMimeType.trim()) {
        throw new AppError('VALIDATION ERROR', 400);
    }
};
