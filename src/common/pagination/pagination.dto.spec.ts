import { buildPaginatedResult } from './pagination.dto';

describe('buildPaginatedResult', () => {
  it('returns a consistent pagination payload', () => {
    const result = buildPaginatedResult([{ id: 1 }], 42, 2, 25);

    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 25,
      total: 42,
      totalPages: 2
    });
    expect(result.data).toHaveLength(1);
  });

  it('returns zero total pages when there are no records', () => {
    const result = buildPaginatedResult([], 0, 1, 25);

    expect(result.pagination.totalPages).toBe(0);
  });
});
