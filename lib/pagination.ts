export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaults: { offset?: number; limit?: number } = {},
) {
  const defaultOffset = defaults.offset ?? 0;
  const defaultLimit = defaults.limit ?? DEFAULT_PAGE_SIZE;

  const rawOffset = Number.parseInt(searchParams.get("offset") ?? "", 10);
  const rawLimit = Number.parseInt(searchParams.get("limit") ?? "", 10);

  const offset = Number.isFinite(rawOffset) && rawOffset >= 0 ? rawOffset : defaultOffset;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0
    ? Math.min(rawLimit, MAX_PAGE_SIZE)
    : defaultLimit;

  return { offset, limit };
}

export function computeHasMore<T>(rows: T[], limit: number) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  return { items, hasMore };
}