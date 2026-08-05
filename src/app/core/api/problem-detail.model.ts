export type ProblemCode =
  | 'VALIDATION_FAILED'
  | 'PRODUCT_NOT_FOUND'
  | 'SALE_NOT_FOUND'
  | 'LOCATION_NOT_FOUND'
  | 'STOCK_INSUFFICIENT'
  | 'INVALID_TRANSFER'
  | 'BUSINESS_RULE_VIOLATION'
  | 'PRODUCT_REFERENCE_ALREADY_USED'
  | 'PRODUCT_NAME_ALREADY_USED'
  | 'CUSTOMER_NOT_FOUND'
  | 'CUSTOMER_PHONE_ALREADY_USED'
  | 'CUSTOMER_EMAIL_ALREADY_USED'
  | 'INVALID_PHONE_NUMBER'
  | 'CREDIT_SALE_REQUIRES_CUSTOMER'
  | 'SALE_ALREADY_SETTLED'
  | 'PAYMENT_EXCEEDS_AMOUNT_DUE'
  | 'CATEGORY_NAME_ALREADY_USED'
  | 'CATEGORY_IN_USE'
  | 'CATEGORY_NOT_FOUND'
  | 'USER_EMAIL_ALREADY_USED'
  | 'USER_NOT_FOUND'
  | 'LAST_ACTIVE_OWNER'
  | 'OWNER_PASSWORD_RESET_FORBIDDEN'
  | 'CURRENT_PASSWORD_INCORRECT'
  | 'INVALID_USER_DATA'
  | 'UNSUPPORTED_FILE'
  | 'FILE_TOO_LARGE'
  | 'INVALID_ENCODING'
  | 'INVALID_HEADER'
  | 'EMPTY_FILE'
  | 'TOO_MANY_ROWS'
  | 'MALFORMED_CSV'
  | 'INVALID_IMPORT_SELECTION'
  | 'IMPORT_ID_REUSED';

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
