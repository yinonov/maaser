// Structured logging for Cloud Functions
// Provides consistent logging interface with different severity levels

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  AUDIT = 'AUDIT',
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: any;
}

// Create formatted log entry
const createLogEntry = (level: LogLevel, message: string, metadata?: any): LogEntry => {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    metadata,
  };
};

// Log functions
export const logger = {
  debug: (message: string, metadata?: any): void => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(JSON.stringify(createLogEntry(LogLevel.DEBUG, message, metadata)));
    }
  },

  info: (message: string, metadata?: any): void => {
    console.info(JSON.stringify(createLogEntry(LogLevel.INFO, message, metadata)));
  },

  warn: (message: string, metadata?: any): void => {
    console.warn(JSON.stringify(createLogEntry(LogLevel.WARN, message, metadata)));
  },

  error: (message: string, error?: Error, metadata?: any): void => {
    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...metadata,
    } : metadata;
    
    console.error(JSON.stringify(createLogEntry(LogLevel.ERROR, message, errorData)));
  },

  // Audit logs for security-critical actions
  audit: (action: string, userId: string, details?: any): void => {
    console.log(JSON.stringify(createLogEntry(LogLevel.AUDIT, action, {
      userId,
      ...details,
    })));
  },
};

export default logger;
