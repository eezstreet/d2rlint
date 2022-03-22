export function seq(start: number, end: number): number[] {
  if (end < start) {
    return seq(end, start);
  }

  const diff = end - start;
  if (diff === 0) {
    return [];
  }

  return Array(diff).fill(0).map((_, i) => i + start);
}
