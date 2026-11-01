export class AppError extends Error {
  constructor(message, code = 'app-error') {
    super(message)
    this.name = 'AppError'
    this.code = code
  }
}

export function toFriendlyError(error) {
  if (error instanceof AppError) return error
  switch (error?.code) {
    case 'permission-denied':
      return new AppError('This account doesn’t have permission to do that.', 'permission-denied')
    case 'unavailable':
    case 'deadline-exceeded':
      return new AppError('Can’t reach the server. Check your connection and try again.', 'unavailable')
    case 'resource-exhausted':
      return new AppError('The free daily limit has been reached. Try again tomorrow.', 'resource-exhausted')
    default:
      return new AppError('Something went wrong. Please try again.', error?.code ?? 'unknown')
  }
}
