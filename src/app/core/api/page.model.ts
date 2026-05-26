export interface PageMeta {
  readonly page: number;
  readonly size: number;
  readonly totalElements: number;
  readonly totalPages: number;
}

export interface Page<T> {
  readonly content: readonly T[];
  readonly page: PageMeta;
}
