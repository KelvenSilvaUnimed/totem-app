// src/routes/pdf.route.ts
import type { FastifyPluginAsync } from 'fastify';
import { requireOkStream } from '../utils/http.js';          // .js em NodeNext
import { safeFilename } from '../utils/strings.js';          // safeFilename fica em strings.ts
import { isAllowedDocUrl } from '../utils/url.js';           // ✅ pegar de url.ts
import { CONFIG } from '../config/env.js';
import { Readable } from 'node:stream';

export const pdfRoute: FastifyPluginAsync = async (fastify) => {
  function effectiveFrameAncestors() {
    const set = new Set(CONFIG.FRAME_ANCESTORS_LIST);
    CONFIG.RAW_CORS_ORIGINS.forEach((o: string) => {         // tipar o param (se necessário)
      if (/^https?:\/\//.test(o)) set.add(o);
    });
    return Array.from(set);
  }

  // ... resto igual
};
