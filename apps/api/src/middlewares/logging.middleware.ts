import { Application } from 'express'
  import morgan from 'morgan'

  export function loggingMiddleware(app: Application) {
    app.use(morgan('dev'))
  }