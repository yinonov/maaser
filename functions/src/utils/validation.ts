// Input validation helpers for API requests
// Provides common validation functions for Cloud Functions

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  errors: ValidationError[];
  
  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.errors = errors;
    this.name = 'ValidationException';
  }
}

// Validate required fields
export const validateRequired = (fields: Record<string, any>): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  for (const [field, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') {
      errors.push({ field, message: `${field} is required` });
    }
  }
  
  return errors;
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate amount (minimum and currency check)
export const validateAmount = (amount: number, minAmount: number = 500): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (typeof amount !== 'number' || isNaN(amount)) {
    errors.push({ field: 'amount', message: 'Amount must be a valid number' });
  } else if (amount < minAmount) {
    errors.push({ field: 'amount', message: `Amount must be at least ${minAmount} agorot (₪${minAmount / 100})` });
  }
  
  return errors;
};

// Validate string length
export const validateLength = (
  value: string, 
  fieldName: string, 
  min: number, 
  max: number
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (value.length < min) {
    errors.push({ field: fieldName, message: `${fieldName} must be at least ${min} characters` });
  }
  if (value.length > max) {
    errors.push({ field: fieldName, message: `${fieldName} must not exceed ${max} characters` });
  }
  
  return errors;
};

// Validate array length
export const validateArrayLength = (
  arr: any[], 
  fieldName: string, 
  min: number, 
  max: number
): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (arr.length < min) {
    errors.push({ field: fieldName, message: `${fieldName} must have at least ${min} items` });
  }
  if (arr.length > max) {
    errors.push({ field: fieldName, message: `${fieldName} must not exceed ${max} items` });
  }
  
  return errors;
};

// Validate Firestore document ID format
export const validateDocumentId = (id: string): boolean => {
  // Firestore document IDs can be up to 1,500 bytes
  // Must not contain forward slashes
  return id.length > 0 && id.length <= 1500 && !id.includes('/');
};
