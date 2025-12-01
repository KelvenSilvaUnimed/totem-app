import { fetch } from 'undici';

export async function requireOkJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const r = await fetch(input as any, init as any);
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`${r.status} ${r.statusText} :: ${t}`);
  }
  return r.json() as Promise<T>;
}

export async function requireOkStream(input: RequestInfo, init?: RequestInit) {
  const r = await fetch(input as any, init as any);
  if (!r.ok) {
    const t = await r.text().catch(() => '');
    throw new Error(`${r.status} ${r.statusText} :: ${t}`);
  }
  return r;
}

const ALLOWED_DOC_DOMAINS = [
  'unimed.com.br',
  'unimedpatos.com.br',
  'unimedpatosdeminas.com.br',
  'sgusuite.com.br',
  'localhost',
  '127.0.0.1',
];

export function isAllowedDocUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_DOC_DOMAINS.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export function safeFilename(filename: string): string {
  if (!filename) return 'arquivo';

  return (
    filename
      // remove caracteres inválidos no Windows
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
      // evita .. ou nomes vazios
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .trim()
      .slice(0, 200) || 'arquivo'
  );
}