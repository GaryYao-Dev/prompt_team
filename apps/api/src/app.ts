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
  console.log(`API server running on port ${PORT}`)
  console.log(`Environment: ${NODE_ENV}`)

  // Optional: Connect to MongoDB if URI is provided
  if (MONGO_URI) {
    try {
      await connectDB(MONGO_URI)
    } catch (error) {
      console.warn(
        'MongoDB connection failed, but server will continue running:',
        error
      )
      // NOTE: Uncomment below to make MongoDB connection required (will exit on failure)
      // process.exit(1)
    }
  } else {
    console.log('MongoDB URI not configured - skipping database connection')
  }
})
