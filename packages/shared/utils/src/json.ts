/** JSON.stringify replacer that serializes BigInt to string. */
export function bigintReplacer(_key: string, value: unknown): unknown {
  return typeof value === 'bigint' ? value.toString() : value;
}

export function stringifySafe(value: unknown): string {
  return JSON.stringify(value, bigintReplacer);
}
