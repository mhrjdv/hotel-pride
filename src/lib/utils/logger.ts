/**
 * Comprehensive logging utility for Hotel Management System
 * Provides structured logging with context for development and production
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  bookingId?: string;
  customerId?: string;
  roomId?: string;
  error?: unknown;
  data?: Record<string, unknown>;
  timestamp?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
    
    if (context?.component) {
      return `${prefix} [${context.component}] ${message}`;
    }
    
    return `${prefix} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (!this.isDevelopment) {
      return level === 'warn' || level === 'error';
    }
    return true;
  }

  private logToConsole(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);
    
    switch (level) {
      case 'debug':
        console.debug(formattedMessage, context);
        break;
      case 'info':
        console.info(formattedMessage, context);
        break;
      case 'warn':
        console.warn(formattedMessage, context);
        break;
      case 'error':
        console.error(formattedMessage, context);
        break;
    }
  }

  private async logToRemote(level: LogLevel, message: string, context?: LogContext): Promise<void> {
    // Only log errors to remote in production
    if (this.isDevelopment || level !== 'error') return;
    
    try {
      // In a real app, you'd send to a logging service like Sentry, LogRocket, etc.
      const logData = {
        level,
        message,
        context,
        timestamp: new Date().toISOString(),
        userAgent: this.isClient ? navigator.userAgent : undefined,
        url: this.isClient ? window.location.href : undefined,
      };

      // Example: await fetch('/api/logs', { method: 'POST', body: JSON.stringify(logData) });
      console.log('Would send to remote logging service:', logData);
    } catch (err) {
      console.error('Failed to log to remote service:', err);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.logToConsole('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.logToConsole('info', message, context);
    this.logToRemote('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.logToConsole('warn', message, context);
    this.logToRemote('warn', message, context);
  }

  error(message: string, error?: unknown, context?: LogContext): void {
    const enrichedContext: LogContext = {
      ...context,
      error: this.serializeError(error),
      timestamp: new Date().toISOString(),
    };

    this.logToConsole('error', message, enrichedContext);
    this.logToRemote('error', message, enrichedContext);
  }

  private serializeError(error: unknown): Record<string, unknown> | string {
    if (error instanceof Error) {
      return {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }
    
    if (typeof error === 'object' && error !== null) {
      try {
        return JSON.parse(JSON.stringify(error));
      } catch {
        return String(error);
      }
    }
    
    return String(error);
  }

  // Specialized logging methods for common hotel operations
  bookingAction(action: string, bookingId: string, message: string, context?: Omit<LogContext, 'action' | 'bookingId'>): void {
    this.info(message, {
      ...context,
      component: 'Booking',
      action,
      bookingId,
    });
  }

  customerAction(action: string, customerId: string, message: string, context?: Omit<LogContext, 'action' | 'customerId'>): void {
    this.info(message, {
      ...context,
      component: 'Customer',
      action,
      customerId,
    });
  }

  roomAction(action: string, roomId: string, message: string, context?: Omit<LogContext, 'action' | 'roomId'>): void {
    this.info(message, {
      ...context,
      component: 'Room',
      action,
      roomId,
    });
  }

  paymentAction(action: string, bookingId: string, amount: number, message: string, context?: Omit<LogContext, 'action' | 'bookingId'>): void {
    this.info(message, {
      ...context,
      component: 'Payment',
      action,
      bookingId,
      data: { amount },
    });
  }

  authAction(action: string, userId?: string, message?: string, context?: Omit<LogContext, 'action' | 'userId'>): void {
    this.info(message || `Authentication ${action}`, {
      ...context,
      component: 'Auth',
      action,
      userId,
    });
  }

  apiError(endpoint: string, error: unknown, context?: LogContext): void {
    this.error(`API Error at ${endpoint}`, error, {
      ...context,
      component: 'API',
      action: endpoint,
    });
  }

  databaseError(operation: string, table: string, error: unknown, context?: LogContext): void {
    this.error(`Database error during ${operation} on ${table}`, error, {
      ...context,
      component: 'Database',
      action: operation,
      data: { table },
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience functions for common patterns
export const logError = (message: string, error: unknown, context?: LogContext) => {
  logger.error(message, error, context);
};

export const logInfo = (message: string, context?: LogContext) => {
  logger.info(message, context);
};

export const logWarn = (message: string, context?: LogContext) => {
  logger.warn(message, context);
};

export const logDebug = (message: string, context?: LogContext) => {
  logger.debug(message, context);
};

// Error boundary helper
export const withErrorLogging = <T extends (...args: unknown[]) => unknown>(
  fn: T,
  component: string,
  action: string
): T => {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error: unknown) => {
          logger.error(`Error in ${component}.${action}`, error, {
            component,
            action,
            data: { args: args.length > 0 ? args : undefined },
          });
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      logger.error(`Error in ${component}.${action}`, error, {
        component,
        action,
        data: { args: args.length > 0 ? args : undefined },
      });
      throw error;
    }
  }) as T;
};

// React hook for component-level logging
export const useLogger = (component: string) => {
  const log = (level: LogLevel, message: string, context?: LogContext) => {
    const componentContext = component ? ` [${component}]` : '';
    const optionalParams = context ? [context] : [];

    if (process.env.NODE_ENV === 'development') {
      console.warn(`[${level.toUpperCase()}]${componentContext}`, message, ...optionalParams);
    }
    // In production, you would send this to a logging service like Sentry, LogRocket, etc.
  };

  const bookingAction = (action: string, context: Omit<LogContext, 'component'> = {}) => {
    log('info', `[BOOKING_ACTION] ${action}`, { ...context, action });
  };

  const apiError = (message: string, error?: any, context: Omit<LogContext, 'component'> = {}) => {
    log('error', `[API_ERROR] ${message}`, { ...context, error: error?.message || error });
  }

  return {
    debug: (message: string, context?: Omit<LogContext, 'component'>) => log('debug', message, context),
    info: (message: string, context?: Omit<LogContext, 'component'>) => log('info', message, context),
    warn: (message: string, context?: Omit<LogContext, 'component'>) => log('warn', message, context),
    error: (message: string, error?: unknown, context?: Omit<LogContext, 'component'>) => log('error', message, { ...context, error }),
    bookingAction,
    apiError,
  };
}; 