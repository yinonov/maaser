// Error handling middleware for Cloud Functions
// Provides consistent error response formatting

import { Response } from 'firebase-functions';
import { ValidationException } from './validation';

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any;
  
  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'ApiError';
  }
}

// Common error types
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',
};

// Error handler middleware
export const handleError = (error: any, res: Response): void => {
  console.error('Error:', error);

  // Handle validation errors
  if (error instanceof ValidationException) {
    res.status(400).json({
      success: false,
      error: {
        code: ErrorCodes.VALIDATION_ERROR,
        message: 'Validation failed',
        details: error.errors,
      },
    } as ErrorResponse);
    return;
  }

  // Handle custom API errors
  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    } as ErrorResponse);
    return;
  }

  // Handle unknown errors
  res.status(500).json({
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    },
  } as ErrorResponse);
};

// Success response helper
export const successResponse = <T>(data: T, res: Response, statusCode: number = 200): void => {
  res.status(statusCode).json({
    success: true,
    data,
  });
};
