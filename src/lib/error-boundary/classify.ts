export type ErrorCategory = 'content' | 'service' | 'unknown'

export interface RecoveryStrategy {
  heading: string
  message: string
  retryable: boolean
}

const CONTENT_PATTERN = /mdx|velite|not found|content/i
const SERVICE_PATTERN = /redis|upstash|fetch|network|ECONNREFUSED|timeout/i

export function classifyError(error: Error): ErrorCategory {
  const msg = error.message
  if (CONTENT_PATTERN.test(msg)) return 'content'
  if (SERVICE_PATTERN.test(msg)) return 'service'
  return 'unknown'
}

export function selectStrategy(category: ErrorCategory): RecoveryStrategy {
  switch (category) {
    case 'content':
      return {
        heading: "This content couldn't be displayed",
        message: 'The content may be temporarily unavailable or may have moved.',
        retryable: false,
      }
    case 'service':
      return {
        heading: 'Temporarily unavailable',
        message: 'A background service is having trouble. This usually resolves on its own.',
        retryable: true,
      }
    case 'unknown':
      return {
        heading: 'Something went wrong',
        message: 'An unexpected error occurred.',
        retryable: true,
      }
  }
}
