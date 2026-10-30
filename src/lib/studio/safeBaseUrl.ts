const PRIVATE_HOST = /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|\[?::1\]?$|metadata\.google\.internal$)/i;

export function safeBaseUrl(value: string, allowPrivate = false): string | null {
  if (!value.trim()) return '';

  try {
    const url = new URL(value.trim());

    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (!allowPrivate && PRIVATE_HOST.test(url.hostname)) return null;

    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}
