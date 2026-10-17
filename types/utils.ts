export type PaginatedResponse<T> = {
  data: T[];
  totalItems: number;
  pageCount: number;
};
