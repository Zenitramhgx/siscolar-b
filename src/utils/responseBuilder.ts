/* eslint-disable @typescript-eslint/no-explicit-any */
interface ApiResponse<T> {
  data?: T;
  meta?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

/**
 * Builds a standard success API response.
 * @param data The data to be returned.
 * @param meta Optional metadata for the response (e.g., pagination).
 * @returns A standardized success API response object.
 */
function buildSuccessResponse<T>(data: T, meta?: Record<string, any>): ApiResponse<T> {
  return {
    data,
    meta: meta || {},
  };
}

/**
 * Builds a standard error API response.
 * @param code The error code (e.g., "VALIDATION_ERROR", "INTERNAL_SERVER_ERROR").
 * @param message A human-readable error message.
 * @param details Optional additional details about the error (e.g., validation errors).
 * @returns A standardized error API response object.
 */
function buildErrorResponse(
  code: string,
  message: string,
  details?: Record<string, any>
): ApiResponse<any> {
  const error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  } = { code, message };
  if (details) {
    error.details = details;
  }
  return { error };
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Builds a standard paginated API response.
 * @param data The array of records for the current page.
 * @param total The total number of records available.
 * @param page The current page number.
 * @param pageSize The number of records per page.
 * @returns A standardized paginated API response object.
 */
export function buildPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  pageSize: number
): ApiResponse<T[]> {
  const totalPages = Math.ceil(total / pageSize);
  const meta: PaginationMeta = {
    page,
    pageSize,
    total,
    totalPages,
  };
  return buildSuccessResponse(data, meta);
}


export { buildSuccessResponse, buildErrorResponse };
export type { ApiResponse };
