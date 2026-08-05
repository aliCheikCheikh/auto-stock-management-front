import { Money } from '../../../core/api/money.model';

export type StockReceiptImportRowAction = 'CREATE_PRODUCT' | 'RECEIVE_EXISTING' | 'REJECT';

export type StockReceiptImportRowExecutionStatus =
  | 'IMPORTED'
  | 'IGNORED_INVALID'
  | 'IGNORED_BY_USER'
  | 'FAILED';

export interface StockReceiptImportIssue {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

export interface StockReceiptImportDistribution {
  readonly locationId: string;
  readonly quantity: number;
}

export interface StockReceiptImportRowPreview {
  readonly lineNumber: number;
  readonly action: StockReceiptImportRowAction;
  readonly reference: string;
  readonly name: string;
  readonly categoryName: string;
  readonly categoryId: string | null;
  readonly unitPrice: Money | null;
  readonly minimumGlobalThreshold: number | null;
  readonly productId: string | null;
  readonly distributions: readonly StockReceiptImportDistribution[];
  readonly issues: readonly StockReceiptImportIssue[];
}

export interface StockReceiptImportSummary {
  readonly totalRows: number;
  readonly productsToCreate: number;
  readonly existingProductsToReceive: number;
  readonly invalidRows: number;
}

export interface StockReceiptImportPreview {
  readonly rows: readonly StockReceiptImportRowPreview[];
  readonly summary: StockReceiptImportSummary;
}

export interface StockReceiptImportRowExecutionResult {
  readonly lineNumber: number;
  readonly status: StockReceiptImportRowExecutionStatus;
  readonly action: StockReceiptImportRowAction;
  readonly reference: string;
  readonly name: string;
  readonly productId: string | null;
  readonly quantityReceived: number;
  readonly issues: readonly StockReceiptImportIssue[];
}

export interface StockReceiptImportExecutionSummary {
  readonly totalRows: number;
  readonly selectedRows: number;
  readonly importedRows: number;
  readonly productsCreated: number;
  readonly existingProductsReceived: number;
  readonly ignoredInvalidRows: number;
  readonly ignoredByUserRows: number;
  readonly failedRows: number;
  readonly totalQuantityReceived: number;
}

export interface StockReceiptImportExecutionReport {
  readonly importId: string;
  readonly rows: readonly StockReceiptImportRowExecutionResult[];
  readonly summary: StockReceiptImportExecutionSummary;
}
