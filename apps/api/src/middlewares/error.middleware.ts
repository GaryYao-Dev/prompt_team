import { NextFunction, Request, Response } from 'express'
  import { ErrorResponse } from '@shared/types'
  import {
    DatabaseError,
    EndpointNotFoundError,
    EntityNotFoundError,
    NoUpdateDataError,
    UnAuthorizedError,
    UniqueConstraintViolationError,
    ValidationError,
  } from '@/utils/error'

  /**
  * Error handling middleware for Express.js
  * returns a JSON response with error details:
  * ```
  * {
  *  error: 'Error message',
  *  statusCode: 500,
  *  timestamp: '2023-10-01T12:00:00Z'
  * }
  * ```
  */
  const errorHandler = (
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    // Check if headers have already been sent
    if (res.headersSent) {
      return next(err)
    }
    console.error(`[${new Date().toISOString()}] Error: ${err.message}`)

    if (err instanceof SyntaxError) {
      const errorResponse: ErrorResponse = {
        type: 'SyntaxError',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      }
      res.status(400).json(errorResponse)
    }

    if (err instanceof EntityNotFoundError) {
      const errorResponse: ErrorResponse = {
        type: 'EntityNotFoundError',
        message: err.message,
        statusCode: 404,
        timestamp: new Date().toISOString(),
      }
      res.status(404).json(errorResponse)
    }

    if (err instanceof UniqueConstraintViolationError) {
      const errorResponse: ErrorResponse = {
        type: 'UniqueConstraintViolationError',
        message: err.message,
        statusCode: 409,
        timestamp: new Date().toISOString(),
      }
      res.status(409).json(errorResponse)
    }

    if (err instanceof ValidationError) {
      const errorResponse: ErrorResponse = {
        type: 'ValidationError',
        message: err.message,
        statusCode: 422,
        timestamp: new Date().toISOString(),
      }
      res.status(422).json(errorResponse)
    }

    if (err instanceof DatabaseError) {
      const errorResponse: ErrorResponse = {
        type: 'DatabaseError',
        message: err.message,
        statusCode: 500,
        timestamp: new Date().toISOString(),
      }
      res.status(500).json(errorResponse)
    }

    if (err instanceof NoUpdateDataError) {
      const errorResponse: ErrorResponse = {
        type: 'NoUpdateDataError',
        message: err.message,
        statusCode: 400,
        timestamp: new Date().toISOString(),
      }
      res.status(400).json(errorResponse)
    }

    if (err instanceof EndpointNotFoundError) {
      const errorResponse: ErrorResponse = {
        type: 'EndpointNotFoundError',
        message: err.message,
        statusCode: 404,
        timestamp: new Date().toISOString(),
      }
      res.status(404).json(errorResponse)
    }

    if (err instanceof UnAuthorizedError) {
      const errorResponse: ErrorResponse = {
        type: 'UnAuthorizedError',
        message: err.message,
        statusCode: 401,
        timestamp: new Date().toISOString(),
      }
      res.status(401).json(errorResponse)
    }
    const errorResponse: ErrorResponse = {
      message:
        process.env.NODE_ENV === 'development'
          ? err.message
          : 'Internal Server Error',
      type: 'InternalServerError',
      statusCode: 500,
      timestamp: new Date().toISOString(),
    }

    res.status(500).json(errorResponse)
  }

  export { errorHandler }
  