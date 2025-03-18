export type DefaultSearchParams = {
  filter?: string;
  sort?: string[];
  join?: string[];
};

export type DefaultPaginationParams = {
  page?: number;
  limit?: number;
};

export type BaseAPIError = {
  status: number;
  data: {
    message: string;
    statusCode: string;
    error: string;
  };
};
