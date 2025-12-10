import { Application } from 'express'
  import { securityMiddleware } from './security.middleware'
  import { loggingMiddleware } from './logging.middleware'
  import express from 'express'

  export function applyMiddlewares(app: Application) {
    securityMiddleware(app)
    loggingMiddleware(app)
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))
  }