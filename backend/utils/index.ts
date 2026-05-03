export const caseInsensitiveCompare = (left?: string, right?: string): boolean =>
  (left ?? "").localeCompare(right ?? "", undefined, { sensitivity: "accent" }) === 0;
