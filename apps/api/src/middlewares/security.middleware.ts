import { Application } from 'express'
  import cors from 'cors'
  import helmet from 'helmet'

  export const securityMiddleware = (app: Application) => {
    app.use(helmet())
    app.use(
      cors({
        origin:
          process.env.NODE_ENV === 'development'
            ? 'http://localhost:3000'
            : process.env.PRODUCTION_DOMAIN,
      })
    )
  }