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