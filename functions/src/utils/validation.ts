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

// Validate story input data
export const validateStoryInput = (data: any): string | null => {
  // Required fields
  if (!data.title || !data.title.trim()) {
    return 'Title is required';
  }
  if (!data.titleHe || !data.titleHe.trim()) {
    return 'Hebrew title is required';
  }
  if (!data.shortDescription || !data.shortDescription.trim()) {
    return 'Short description is required';
  }
  if (!data.shortDescriptionHe || !data.shortDescriptionHe.trim()) {
    return 'Hebrew short description is required';
  }
  if (!data.description || !data.description.trim()) {
    return 'Description is required';
  }
  if (!data.descriptionHe || !data.descriptionHe.trim()) {
    return 'Hebrew description is required';
  }
  if (!data.ngoId) {
    return 'NGO ID is required';
  }

  // Length validations
  if (data.title.length > 100) {
    return 'Title must not exceed 100 characters';
  }
  if (data.shortDescription.length > 300) {
    return 'Short description must not exceed 300 characters';
  }
  if (data.description.length < 300) {
    return 'Description must be at least 300 characters';
  }
  if (data.description.length > 5000) {
    return 'Description must not exceed 5000 characters';
  }

  // Tags validation
  if (!data.tags || !Array.isArray(data.tags) || data.tags.length === 0) {
    return 'At least one tag is required';
  }
  if (data.tags.length > 5) {
    return 'Maximum 5 tags allowed';
  }

  // Images validation
  if (!data.images || !Array.isArray(data.images) || data.images.length === 0) {
    return 'At least one image is required';
  }
  if (data.images.length > 5) {
    return 'Maximum 5 images allowed';
  }

  // Category validation
  if (!data.category) {
    return 'Category is required';
  }

  // Goal amount validation (if provided)
  if (data.goalAmount !== null && data.goalAmount !== undefined) {
    if (typeof data.goalAmount !== 'number') {
      return 'Goal amount must be a number';
    }
    if (data.goalAmount < 50000) {
      return 'Goal amount must be at least ₪500 (50000 agorot)';
    }
    if (data.goalAmount > 100000000) {
      return 'Goal amount must not exceed ₪1,000,000';
    }
  }

  return null;
};

