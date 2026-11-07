/**
 * French typography: a (narrow) no-break space before "!", "?", ";" and ":", and inside « ».
 * Applied to a whole translation, including the strings returned by its functions.
 */

export function frenchSpaces(text: string): string {
  return text
    .replace(/ ([!?;])/g, " $1")
    .replace(/ :/g, " :")
    .replace(/« /g, "« ")
    .replace(/ »/g, " »");
}

export function mapStrings<T>(value: T, fix: (text: string) => string): T {
  if (typeof value === "string") return fix(value) as T;
  if (typeof value === "function") {
    const fn = value as (...args: unknown[]) => unknown;
    return ((...args: unknown[]) => mapStrings(fn(...args), fix)) as T;
  }
  if (Array.isArray(value)) return value.map((item) => mapStrings(item, fix)) as T;
  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fix)])) as T;
  }
  return value;
}
