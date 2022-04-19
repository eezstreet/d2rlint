const inequalPropertyMapper:
  ((
    min: number,
    max: number,
    descstrpos: string,
    descstrneg: string,
  ) => string)[] = [
    () => ``,
    (min, max, pos, neg) => {
      if (min < 0 && max < 0) {
        return `${min} to ${max} ${neg}`;
      } else if (min > 0 && max > 0) {
        return `+${min}-${max} ${pos}`;
      } else if (pos.toLocaleLowerCase() === neg.toLocaleLowerCase()) {
        return `${min} to ${max} ${neg}`;
      }
      return `${min} to ${max} (${neg}/${pos})`;
    },
    (min, max, desc) => {
      if (min < 0 || max < 0) {
        return `${min} to ${max} ${desc}`;
      }
      return `${min}-${max} ${desc}`;
    },
    (min, max, desc) => {
      if (min < 0 || max < 0) {
        return `${min} to ${max} ${desc}`;
      }
      return `${min}-${max} ${desc}`;
    },
  ];

export function StringForProperty(
  min: number,
  max: number,
  func: number,
  descstrpos: string,
  descstrneg: string,
): string {
}
