export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function matchesSearchQuery(
  value: string | null | undefined,
  query: string,
): boolean {
  if (!query || !value) return false;
  return value.toLowerCase().includes(query);
}

export function matchesAnySearchQuery(
  values: Array<string | null | undefined>,
  query: string,
): boolean {
  return values.some((value) => matchesSearchQuery(value, query));
}
