"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeFilename = exports.onlyDigits = void 0;
const onlyDigits = (s) => (s ?? '').replace(/\D/g, '');
exports.onlyDigits = onlyDigits;
const safeFilename = (str = 'boleto.pdf') => String(str).replace(/[^a-zA-Z0-9_.-]/g, '_');
exports.safeFilename = safeFilename;
