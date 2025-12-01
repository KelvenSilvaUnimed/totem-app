export function isAllowedDocUrl(raw: string): boolean {
try {
const u = new URL(raw);
return (
u.protocol === 'https:' &&
u.hostname === 'api.unimedpatos.sgusuite.com.br' &&
u.pathname.startsWith('/document/')
);
} catch {
return false;
}
}