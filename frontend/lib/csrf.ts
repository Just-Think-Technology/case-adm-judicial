// Reads the double-submit CSRF cookie issued by GET /bff/auth/csrf-token and
// ensures one exists before a mutation. The cookie is readable by design
// (httpOnly: false); the secret half never leaves the backend session.
export async function ensureCsrfToken(): Promise<string> {
  const fromCookie = document.cookie
    .split('; ')
    .find((part) => part.startsWith('csrf_token='))
    ?.slice('csrf_token='.length);
  if (fromCookie) return fromCookie;
  const response = await fetch('/bff/auth/csrf-token');
  if (!response.ok) throw new Error('Não foi possível preparar o envio. Recarregue a página.');
  const token = document.cookie
    .split('; ')
    .find((part) => part.startsWith('csrf_token='))
    ?.slice('csrf_token='.length);
  if (!token) throw new Error('Não foi possível preparar o envio. Recarregue a página.');
  return token;
}
