import { AppError } from './errors.js'

export function withTimeout(promise, ms = 20000) {
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new AppError('The server didn’t confirm in time. Check your connection. If your change appears after you reconnect, it was saved then.', 'timeout')),
      ms,
    )
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}
