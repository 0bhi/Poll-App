import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, CancelTokenSource } from "axios";
import { logger } from "./logger";

/**
 * Standard API response format for success responses
 */
export interface ApiSuccessResponse<T, M = unknown> {
  data: T;
  meta?: M;
}

/**
 * Standard API response format for error responses
 */
export interface ApiErrorResponse {
  error: string;
  code?: string;
  details?: unknown;
}

/**
 * API client configuration
 */
interface ApiClientConfig extends AxiosRequestConfig {
  skipErrorLogging?: boolean;
}

/**
 * Custom error class for API errors
 */
export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code?: string,
    details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Centralized API client
 * 
 * Features:
 * - Type-safe requests and responses
 * - Standardized error handling
 * - Request/response interceptors
 * - Support for cancellation tokens
 * - Automatic error logging
 */
class ApiClient {
  private client: AxiosInstance;
  private cancelTokenSource: CancelTokenSource | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: "",
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Request interceptor - can be used for auth tokens, etc.
    this.client.interceptors.request.use(
      (config) => {
        // Add any request modifications here (e.g., auth tokens)
        return config;
      },
      (error) => {
        logger.error("Request interceptor error", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handles standard response format
    this.client.interceptors.response.use(
      (response) => {
        // Response is already in the standard format { data: T, meta?: M }
        return response;
      },
      (error: AxiosError<ApiErrorResponse>) => {
        // Handle error responses
        if (error.response) {
          const errorData = error.response.data;
          const statusCode = error.response.status;
          const errorMessage = errorData?.error || error.message || "An error occurred";
          const errorCode = errorData?.code;
          const errorDetails = errorData?.details;

          // Log error (unless explicitly skipped)
          if (!(error.config as ApiClientConfig)?.skipErrorLogging) {
            logger.error("API error response", {
              statusCode,
              error: errorMessage,
              code: errorCode,
              url: error.config?.url,
              method: error.config?.method,
            });
          }

          return Promise.reject(
            new ApiError(errorMessage, statusCode, errorCode, errorDetails)
          );
        }

        // Network or other errors
        if (error.request) {
          logger.error("Network error - no response received", {
            url: error.config?.url,
            method: error.config?.method,
          });
          return Promise.reject(
            new ApiError("Network error. Please check your connection.", 0, "NETWORK_ERROR")
          );
        }

        // Request setup error
        logger.error("Request setup error", error);
        return Promise.reject(
          new ApiError(error.message || "Request failed", 0, "REQUEST_ERROR")
        );
      }
    );
  }

  /**
   * GET request
   */
  async get<T = unknown, M = unknown>(
    url: string,
    config?: ApiClientConfig
  ): Promise<ApiSuccessResponse<T, M>> {
    try {
      const response = await this.client.get<ApiSuccessResponse<T, M>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * POST request
   */
  async post<T = unknown, M = unknown>(
    url: string,
    data?: unknown,
    config?: ApiClientConfig
  ): Promise<ApiSuccessResponse<T, M>> {
    try {
      const response = await this.client.post<ApiSuccessResponse<T, M>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PUT request
   */
  async put<T = unknown, M = unknown>(
    url: string,
    data?: unknown,
    config?: ApiClientConfig
  ): Promise<ApiSuccessResponse<T, M>> {
    try {
      const response = await this.client.put<ApiSuccessResponse<T, M>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * PATCH request
   */
  async patch<T = unknown, M = unknown>(
    url: string,
    data?: unknown,
    config?: ApiClientConfig
  ): Promise<ApiSuccessResponse<T, M>> {
    try {
      const response = await this.client.patch<ApiSuccessResponse<T, M>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * DELETE request
   */
  async delete<T = unknown, M = unknown>(
    url: string,
    config?: ApiClientConfig
  ): Promise<ApiSuccessResponse<T, M>> {
    try {
      const response = await this.client.delete<ApiSuccessResponse<T, M>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a cancel token source for request cancellation
   */
  createCancelToken(): CancelTokenSource {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel("New request initiated");
    }
    this.cancelTokenSource = axios.CancelToken.source();
    return this.cancelTokenSource;
  }

  /**
   * Cancel current request
   */
  cancelRequest(message?: string): void {
    if (this.cancelTokenSource) {
      this.cancelTokenSource.cancel(message || "Request cancelled");
      this.cancelTokenSource = null;
    }
  }

  /**
   * Check if an error is an Axios error
   */
  isAxiosError(error: unknown): error is AxiosError {
    return axios.isAxiosError(error);
  }

  /**
   * Check if an error is an ApiError
   */
  isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }

  /**
   * Handle errors consistently
   */
  private handleError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (axios.isCancel(error)) {
      return new ApiError("Request cancelled", 0, "CANCELLED");
    }

    if (axios.isAxiosError(error)) {
      // This should have been handled by the interceptor, but just in case
      const statusCode = error.response?.status || 0;
      const errorData = error.response?.data as ApiErrorResponse | undefined;
      return new ApiError(
        errorData?.error || error.message || "An error occurred",
        statusCode,
        errorData?.code,
        errorData?.details
      );
    }

    // Unknown error type
    logger.error("Unknown error type in API client", error);
    return new ApiError(
      error instanceof Error ? error.message : "An unknown error occurred",
      0,
      "UNKNOWN_ERROR"
    );
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export types for convenience
export type { ApiClientConfig };

