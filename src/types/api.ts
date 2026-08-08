export type ApiError = {
  code: string;
  message: string;
};

export type ApiResponse<T> = {
  data: T;
  error?: ApiError | null;
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};
