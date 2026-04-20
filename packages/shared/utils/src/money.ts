import { CURRENCY_MINOR_UNITS, type SupportedCurrency } from '@ecopye/constants';

/** Convert a human-readable decimal ("12.50") into minor-unit BigInt (1250n). */
export function toCentimes(amount: string | number, currency: SupportedCurrency = 'DZD'): bigint {
  const minor = CURRENCY_MINOR_UNITS[currency];
  const str = typeof amount === 'number' ? amount.toFixed(Math.log10(minor)) : amount.trim();
  if (!/^-?\d+(\.\d+)?$/.test(str)) {
    throw new Error(`Invalid amount: ${amount}`);
  }
  const [wholeRaw, fracRaw = ''] = str.split('.');
  const whole = wholeRaw ?? '0';
  const frac = (fracRaw + '0'.repeat(String(minor).length - 1)).slice(0, String(minor).length - 1);
  const sign = whole.startsWith('-') ? -1n : 1n;
  const wholeAbs = whole.replace('-', '');
  return sign * (BigInt(wholeAbs) * BigInt(minor) + BigInt(frac || '0'));
}

/** Convert minor units to decimal string ("12.50"). */
export function fromCentimes(minorUnits: bigint, currency: SupportedCurrency = 'DZD'): string {
  const minor = CURRENCY_MINOR_UNITS[currency];
  const decimals = String(minor).length - 1;
  const neg = minorUnits < 0n;
  const abs = neg ? -minorUnits : minorUnits;
  const whole = abs / BigInt(minor);
  const frac = (abs % BigInt(minor)).toString().padStart(decimals, '0');
  return `${neg ? '-' : ''}${whole.toString()}.${frac}`;
}

/** Human-friendly format ("15 000,00 DZD"). */
export function formatMoney(minorUnits: bigint, currency: SupportedCurrency = 'DZD'): string {
  const decimal = fromCentimes(minorUnits, currency);
  const [w, f] = decimal.split('.');
  const withSpaces = (w ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${withSpaces},${f ?? '00'} ${currency}`;
}

/** basis points → fractional amount (BigInt, rounded half-up). */
export function applyBps(amount: bigint, bps: number): bigint {
  if (bps === 0) return 0n;
  const num = amount * BigInt(bps);
  const denom = 10_000n;
  const q = num / denom;
  const r = num % denom;
  // Half-up rounding
  return r * 2n >= denom ? q + 1n : q;
}
