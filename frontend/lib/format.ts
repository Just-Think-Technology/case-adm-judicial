const dateFormatter = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Cuiaba' });

// Renders an ISO timestamp as a short pt-BR date. Falls back to the raw
// value when it is not a valid date, never throws on API payloads.
export function formatDate(value: string): string {
  const time = Date.parse(value);
  if (Number.isNaN(time)) return value;
  return dateFormatter.format(new Date(time));
}
