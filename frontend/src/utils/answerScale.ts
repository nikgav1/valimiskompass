const ANSWER_SCALE = [-1, -0.5, 0, 0.5, 1] as const;

export function mapIndexToValue(index: number): number {
  return ANSWER_SCALE[index] ?? 0;
}

export function valueToIndex(value: number | null): number | null {
  if (value === null) return null;
  switch (value) {
    case -1:
      return 0;
    case -0.5:
      return 1;
    case 0:
      return 2;
    case 0.5:
      return 3;
    case 1:
      return 4;
    default:
      return null;
  }
}
