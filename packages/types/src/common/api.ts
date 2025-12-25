/**
 * Common API response types
 */

/**
 * Standard API success response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  error: null;
}

/**
 * Standard API error response wrapper
 */
export interface ApiErrorResponse {
  data: null;
  error: ApiError;
}

/**
 * Unified API response type
 */
export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

/**
 * API error structure
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Pagination parameters for list endpoints
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

/**
 * Sort direction for ordered queries
 */
export type SortDirection = "asc" | "desc";

/**
 * Sort parameters
 */
export interface SortParams<T extends string = string> {
  sortBy: T;
  sortDirection: SortDirection;
}

/**
 * Date range filter
 */
export interface DateRange {
  from: string;
  to: string;
}
