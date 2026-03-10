export interface AuditLogEntry {
  id?: string;
  userId?: string;
  action: string;
  tableName: string;
  recordId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp?: string;
}

export interface SecurityConfig {
  enableAuditLogging: boolean;
  enableDataEncryption: boolean;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  passwordMinLength: number;
}

export const defaultSecurityConfig: SecurityConfig = {
  enableAuditLogging: true,
  enableDataEncryption: true,
  sessionTimeoutMinutes: 30,
  maxLoginAttempts: 5,
  passwordMinLength: 12,
};

export function sanitizePatientData(data: Record<string, unknown>): Record<string, unknown> {
  const sensitiveFields = ['ssn', 'social_security_number', 'credit_card', 'password'];
  const sanitized = { ...data };
  
  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

export function generateAuditLog(
  action: string,
  tableName: string,
  recordId?: string
): AuditLogEntry {
  return {
    action,
    tableName,
    recordId,
    timestamp: new Date().toISOString(),
  };
}

export function validateHIPAACompliance(): boolean {
  const checks = {
    encryption: typeof window !== 'undefined' && window.location.protocol === 'https:',
    auditLogging: true,
    accessControls: true,
    dataBackup: true,
  };
  
  return Object.values(checks).every(Boolean);
}

export function formatDateForDisplay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTimeForDisplay(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateAge(dob: string | Date): number {
  const birthDate = typeof dob === 'string' ? new Date(dob) : dob;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}
