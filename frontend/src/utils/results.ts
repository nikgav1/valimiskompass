export type PoliticianMatch = {
  party: string;
  name: string;
  candidateNumber: string;
  percent: number | null;
};

export type ResultShape =
  | PoliticianMatch[]
  | Record<string, PoliticianMatch>
  | null
  | undefined;

export type SortOrder = "desc" | "asc";

export function toResultArray(raw: ResultShape): PoliticianMatch[] | undefined {
  if (Array.isArray(raw)) return raw;
  if (raw) return Object.values(raw);
  return undefined;
}

export function sortMatches(
  matches: PoliticianMatch[],
  sortOrder: SortOrder
): PoliticianMatch[] {
  return [...matches].sort((a, b) => {
    const va =
      typeof a.percent === "number" && Number.isFinite(a.percent)
        ? a.percent
        : -Infinity;
    const vb =
      typeof b.percent === "number" && Number.isFinite(b.percent)
        ? b.percent
        : -Infinity;
    return sortOrder === "desc" ? vb - va : va - vb;
  });
}
