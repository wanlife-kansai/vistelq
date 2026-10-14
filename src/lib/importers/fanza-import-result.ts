export type FanzaImportErrorCode =
  | 'API'
  | 'VALIDATION'
  | 'DATABASE'
  | 'UNKNOWN';

export type FanzaImportResult =
  | {
      status: 'completed';
      fetched: number;
      created: number;
      updated: number;
    }
  | {
      status: 'busy';
      fetched: number;
      created: 0;
      updated: 0;
    }
  | {
      status: 'failed';
      code: FanzaImportErrorCode;
      error: string;
    };

export class FanzaImportError extends Error {
  constructor(
    public readonly code: FanzaImportErrorCode,
    message: string
  ) {
    super(message);
    this.name = 'FanzaImportError';
  }
}

const PUBLIC_ERROR_MESSAGES: Record<FanzaImportErrorCode, string> = {
  API: 'API request failed',
  VALIDATION: 'Import data validation failed',
  DATABASE: 'Database operation failed',
  UNKNOWN: 'Import processing failed',
};

export function classifyFanzaImportError(
  error: unknown
): Extract<FanzaImportResult, { status: 'failed' }> {
  const code =
    error instanceof FanzaImportError
      ? error.code
      : 'UNKNOWN';

  return {
    status: 'failed',
    code,
    error: PUBLIC_ERROR_MESSAGES[code],
  };
}

export function isFanzaImportSuccess(
  result: FanzaImportResult
): boolean {
  return result.status === 'completed';
}
