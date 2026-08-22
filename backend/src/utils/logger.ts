type LogLevel = 'info' | 'warn' | 'error'

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitize)
  }

  if (!value || typeof value !== 'object') {
    return value
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => {
      if (key === 'tasks' && Array.isArray(entryValue)) {
        return [key, { count: entryValue.length }]
      }

      if (key.toLowerCase().includes('title') || key.toLowerCase().includes('task')) {
        return [key, '[masked]']
      }

      return [key, sanitize(entryValue)]
    }),
  )
}

function log(level: LogLevel, message: string, metadata: Record<string, unknown> = {}) {
  const safeMetadata = sanitize(metadata) as Record<string, unknown>

  console[level === 'error' ? 'error' : 'log'](
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...safeMetadata,
    }),
  )
}

export const logger = {
  info(message: string, metadata?: Record<string, unknown>) {
    log('info', message, metadata)
  },
  warn(message: string, metadata?: Record<string, unknown>) {
    log('warn', message, metadata)
  },
  error(message: string, metadata?: Record<string, unknown>) {
    log('error', message, metadata)
  },
}
