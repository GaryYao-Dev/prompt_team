import 'dotenv/config'
  import express from 'express'
  import { API_PREFIX, MONGO_URI, NODE_ENV, PORT } from './config/env'
  import { applyMiddlewares } from './middlewares'
  import routes from './routes'
  import { errorHandler } from './middlewares/error.middleware'
  import { connectDB } from './config/mongoDB'

  const app = express()

  applyMiddlewares(app)

  app.use(API_PREFIX, routes)

  app.use(errorHandler)

  // Start the server
  app.listen(PORT, async () => {
    try {
      if (!MONGO_URI) {
        throw new Error('MongoDB URI is not defined in environment variables.')
      }
      await connectDB(MONGO_URI)
      console.log(`API server running on port ${PORT}`)
    } catch (error) {
      console.error('Error starting server:', error)
      process.exit(1)
    } finally {
      console.log(`Environment: ${NODE_ENV}`)
    }
  })
  