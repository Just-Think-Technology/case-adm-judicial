const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Cuiaba' });

// Renders an ISO timestamp as a short pt-BR date. Falls back to the raw
// value when it is not a valid date, never throws on API payloads.
export function formatDate(value: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return dateFormatter.format(new Date(time));
}

// Relative age in pt-BR for card footers ("hoje", "há 3 dias"). Future or
// invalid values fall back to the short date, never to an empty string.
export function formatRelative(value: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  const days = Math.floor((Date.now() - time) / 86_400_000);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'há 1 dia';
  return `há ${days} dias`;
}
