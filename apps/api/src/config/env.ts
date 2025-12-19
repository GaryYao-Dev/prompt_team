export const PORT = process.env.API_PORT || 8001
export const NODE_ENV = process.env.NODE_ENV || 'development'
export const API_PREFIX = process.env.API_PREFIX || '/api'
export const MONGO_URI = process.env.MONGO_URI
export const HA_NOTIFICATION_TOKEN = process.env.HA_NOTIFICATION_TOKEN
export const HA_NOTIFICATION_URL = process.env.HA_NOTIFICATION_URL

// Email SMTP Configuration (Gmail)
export const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com'
export const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587')
export const SMTP_SECURE = process.env.SMTP_SECURE === 'true' // true for 465, false for other ports
export const SMTP_USER = process.env.SMTP_USER || ''
export const SMTP_PASS = process.env.SMTP_PASS || ''
export const EMAIL_FROM =
  process.env.EMAIL_FROM || 'ModaFitClub <noreply@modafitclub.com>'
