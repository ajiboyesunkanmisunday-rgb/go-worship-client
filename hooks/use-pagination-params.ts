import { parseAsJson, useQueryState } from 'nuqs';
import z from 'zod';

export const paginationQuerySchema = z
  .object({
    pageIndex: z.number().min(0).default(0),
    pageSize: z.number().min(1).max(100).default(10),
  })
  .required();

export function usePaginationParams() {
  const [pagination, setPagination] = useQueryState(
    'p',
    parseAsJson(paginationQuerySchema).withDefault({
      pageIndex: 0,
      pageSize: 10,
    })
  );
  return { pagination, setPagination };
}
