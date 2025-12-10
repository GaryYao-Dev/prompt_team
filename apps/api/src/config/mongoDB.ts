import mongoose from 'mongoose'

  const connectDB = async (uri: string) => {
    try {
      const connection = mongoose.connection
      connection.on('error', console.error.bind(console, 'connection error:'))
      connection.on('connected', () => {
        console.log('Connected to MongoDB')
      })
      connection.once('open', () => {
        console.log('MongoDB is ready')
      })
      connection.on('disconnected', () => {
        console.log('Disconnected from MongoDB')
      })

      await mongoose.connect(uri)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error connecting to MongoDB'
      console.error(`Error connecting to MongoDB: ${message}`)
    }
  }

  export { connectDB }