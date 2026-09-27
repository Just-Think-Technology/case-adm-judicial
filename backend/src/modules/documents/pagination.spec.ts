// Pagination — page query into skip/take

import { InvalidPageError, PAGE_SIZE, parsePage, totalPages } from './pagination';

describe('parsePage', () => {
  it('defaults to the first page', () => {
    expect(parsePage(undefined)).toEqual({ page: 1, take: PAGE_SIZE, skip: 0 });
    expect(parsePage('')).toEqual({ page: 1, take: PAGE_SIZE, skip: 0 });
  });

  it('computes skip from the page', () => {
    expect(parsePage('3')).toEqual({ page: 3, take: PAGE_SIZE, skip: 2 * PAGE_SIZE });
  });

  it('rejects non-positive integers instead of clamping', () => {
    expect(() => parsePage('0')).toThrow(InvalidPageError);
    expect(() => parsePage('-2')).toThrow(InvalidPageError);
    expect(() => parsePage('1.5')).toThrow(InvalidPageError);
    expect(() => parsePage('todas')).toThrow(InvalidPageError);
  });

  it('counts pages with a single shared size', () => {
    expect(PAGE_SIZE).toBe(10);
    expect(totalPages(0)).toBe(1);
    expect(totalPages(10)).toBe(1);
    expect(totalPages(11)).toBe(2);
  });
});
