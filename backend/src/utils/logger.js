/**
 * Enterprise Structured Logger for VEAYOS Homoeopathy ClinicalOS
 */

const LOG_LEVELS = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const currentLogLevel = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level) {
  const currentPriority = LOG_LEVELS[currentLogLevel] ?? 1;
  const targetPriority = LOG_LEVELS[level] ?? 1;
  return targetPriority >= currentPriority;
}

function sanitize(data) {
  if (!data || typeof data !== 'object') return data;
  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  const sensitiveKeys = ['password', 'token', 'jwt', 'secret', 'apiKey', 'credential', 'authorization'];

  for (const key of Object.keys(sanitized)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      sanitized[key] = sanitize(sanitized[key]);
    }
  }
  return sanitized;
}

export const logger = {
  debug(msg, meta) {
    if (shouldLog('debug')) {
      console.debug(`[DEBUG] ${new Date().toISOString()} - ${msg}`, meta ? sanitize(meta) : '');
    }
  },
  info(msg, meta) {
    if (shouldLog('info')) {
      console.log(`[INFO]  ${new Date().toISOString()} - ${msg}`, meta ? sanitize(meta) : '');
    }
  },
  warn(msg, meta) {
    if (shouldLog('warn')) {
      console.warn(`[WARN]  ${new Date().toISOString()} - ${msg}`, meta ? sanitize(meta) : '');
    }
  },
  error(msg, meta) {
    if (shouldLog('error')) {
      console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`, meta ? (meta instanceof Error ? meta.stack : sanitize(meta)) : '');
    }
  }
};

export default logger;
