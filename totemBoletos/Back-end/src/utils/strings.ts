export const onlyDigits = (s?: string) => (s ?? '').replace(/\D/g, '');
export const safeFilename = (str = 'boleto.pdf') => String(str).replace(/[^a-zA-Z0-9_.-]/g, '_');