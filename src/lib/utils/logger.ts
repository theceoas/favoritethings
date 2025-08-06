const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },
  error: (...args: any[]) => {
    console.error(...args) // Always log errors
  },
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args)
    }
  },
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.info(...args)
    }
  }
} 