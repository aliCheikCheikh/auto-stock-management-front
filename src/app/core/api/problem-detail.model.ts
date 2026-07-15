export type ProblemCode =
  | 'VALIDATION_FAILED'
  | 'PRODUCT_NOT_FOUND'
  | 'SALE_NOT_FOUND'
  | 'LOCATION_NOT_FOUND'
  | 'STOCK_INSUFFICIENT'
  | 'INVALID_TRANSFER'
  | 'BUSINESS_RULE_VIOLATION'
  | 'PRODUCT_REFERENCE_ALREADY_USED'
  | 'PRODUCT_NAME_ALREADY_USED';

export interface ProblemValidationError {
  readonly field: string;
  readonly message: string;
  readonly rejectedValue?: unknown;
}

export interface ProblemDetail {
  readonly type: string;
  readonly title: string;
  readonly status: number;
  readonly detail?: string;
  readonly code?: ProblemCode;
  readonly errors?: readonly ProblemValidationError[];
}
