export class EntityNotFoundError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'EntityNotFoundError'
    }
  }

  export class UniqueConstraintViolationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'UniqueConstraintViolationError'
    }
  }
  export class NoUpdateDataError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'NoUpdateDataError'
    }
  }

  export class ValidationError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'ValidationError'
    }
  }

  export class DatabaseError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'DatabaseError'
    }
  }

  export class PayloadError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'PayloadError'
    }
  }

  export class UnAuthorizedError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'UnAuthorizedError'
    }
  }

  export class EndpointNotFoundError extends Error {
    constructor(message: string) {
      super(message)
      this.name = 'EndpointNotFoundError'
    }
  }
  