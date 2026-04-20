const ALGERIAN_PHONE = /^\+213[567]\d{8}$/;

/** Normalise DZ phone to E.164 `+213XXXXXXXXX`. Accepts 0X..., 213X..., +213X... */
export function normalizeAlgerianPhone(input: string): string {
  const cleaned = input.replace(/[\s\-().]/g, '');
  if (ALGERIAN_PHONE.test(cleaned)) return cleaned;
  if (/^0[567]\d{8}$/.test(cleaned)) return `+213${cleaned.slice(1)}`;
  if (/^213[567]\d{8}$/.test(cleaned)) return `+${cleaned}`;
  throw new Error('Numéro de téléphone algérien invalide');
}

export function isAlgerianPhone(input: string): boolean {
  return ALGERIAN_PHONE.test(input);
}

/** Mask a phone number for display: `+213 5•• ••• •56`. */
export function maskPhone(phone: string): string {
  if (!ALGERIAN_PHONE.test(phone)) return phone;
  const last2 = phone.slice(-2);
  const prefix = phone.slice(0, 6);
  return `${prefix}••• •${last2}`;
}
