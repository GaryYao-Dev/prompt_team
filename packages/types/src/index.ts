export type User = {
    id: string
    name: string
    email: string
  }

  export type ApiResponse<T> = {
    data: T
    success: boolean
    timestamp: string
  }

  export type ErrorResponse = {
    message: string
    type: string
    statusCode: number
    timestamp: string
  }
  