const ERROR_MESSAGES: Record<string, string> = {
  INSUFFICIENT_BALANCE: 'Insufficient balance. Please add credits.',
  INVALID_STAKE: 'Invalid stake amount.',
  NO_SELECTIONS: 'No selections in your bet slip.',
  SINGLE_BET_ONE_SELECTION: 'Single bet requires exactly one selection.',
  ACCUMULATOR_MIN_TWO: 'Accumulator requires at least two selections.',
  PAYOUT_EXCEEDS_LIMIT: 'Potential payout exceeds the maximum limit.',
  BET_NOT_FOUND: 'Bet not found.',
  BET_NOT_OPEN: 'This bet is no longer open.',
  INVALID_CREDENTIALS: 'Invalid username or password.',
  BRUTE_FORCE_BLOCKED: 'Too many failed attempts. Please try again later.',
  USER_INACTIVE: 'Your account has been suspended.',
  NOT_DIRECT_SUBORDINATE: 'You can only transfer to your direct subordinates.',
  RECEIVER_NOT_FOUND: 'Recipient not found.',
};

export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] || code;
}

export function extractApiError(error: unknown): string {
  if (
    typeof error === 'object'
    && error !== null
    && 'response' in error
    && typeof (error as { response?: unknown }).response === 'object'
    && (error as { response?: unknown }).response !== null
    && 'data' in ((error as { response: { data?: unknown } }).response)
    && typeof (error as { response: { data?: { message?: unknown } } }).response.data?.message === 'string'
  ) {
    return (error as { response: { data: { message: string } } }).response.data.message;
  }
  if (
    typeof error === 'object'
    && error !== null
    && 'response' in error
    && typeof (error as { response?: unknown }).response === 'object'
    && (error as { response?: unknown }).response !== null
    && 'data' in ((error as { response: { data?: unknown } }).response)
    && typeof (error as { response: { data?: { error?: unknown } } }).response.data?.error === 'string'
  ) {
    return (error as { response: { data: { error: string } } }).response.data.error;
  }
  return 'An unexpected error occurred';
}
