/**
 * Utilitários de formatação e parsing — camada de serviço puro (sem side-effects).
 */

/** Remove todos os caracteres não-numéricos. */
export const digits = (value: string): string => (value || '').replace(/\D/g, '');

/** Formata nome completo com inicial maiúscula em cada palavra. */
export const formatNomeCompleto = (nome: string): string => {
  if (!nome) return 'Beneficiário';
  return nome
    .trim()
    .split(/\s+/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
};

/** Formata entrada de CPF com pontos e traço: 000.000.000-00 */
export const formatCpfInput = (value: string): string => {
  const d = digits(value);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
};

/** Formata DD/MM/AAAA a partir de até 8 dígitos digitados. */
export const formatDataNascimentoInput = (value: string): string => {
  const d = (value || '').replace(/\D/g, '').slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};

/**
 * Normaliza `data_nascimento_titular` (vinda do lookup) para 8 dígitos DDMMAAAA,
 * para comparar com o valor digitado pelo usuário.
 */
export const normalizeDataTitularToDdmmYyyyDigits = (
  value: string | undefined | null,
): string | null => {
  if (value == null || String(value).trim() === '') return null;
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, dd] = s.slice(0, 10).split('-');
    if (y && m && dd) return `${dd}${m}${y}`;
  }
  const d = s.replace(/\D/g, '');
  if (d.length !== 8) return null;
  const y = parseInt(d.slice(0, 4), 10);
  if (y >= 1900 && y <= 2100) {
    return `${d.slice(6)}${d.slice(4, 6)}${d.slice(0, 4)}`;
  }
  return d;
};

/** Formata data no padrão brasileiro (DD/MM/AAAA). */
export const formatarData = (value: string): string | null => {
  if (!value) return null;
  const s = String(value).trim();
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 2)}/${s.slice(2, 4)}/${s.slice(4)}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [a, m, d] = s.split('-');
    return `${d}/${m}/${a}`;
  }
  return s;
};

/** Formata valor monetário no padrão pt-BR. */
export const formatarValor = (value: number | string | null | undefined): string | null => {
  if (value == null) return null;
  const n = Number(String(value).replace(',', '.'));
  return Number.isFinite(n)
    ? n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    : String(value);
};

/** Retorna o primeiro valor não-nulo de `obj` para as chaves listadas. */
export const escolherPrimeiroValor = <T>(
  obj: Record<string, T> | null,
  chaves: string[],
  fallback: T | null = null,
): T | null => {
  if (!obj) return fallback;
  for (const k of chaves) {
    if (obj[k] != null) return obj[k];
  }
  return fallback;
};
