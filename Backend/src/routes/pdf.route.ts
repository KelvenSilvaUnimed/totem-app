import type { FastifyPluginAsync } from 'fastify';
import { CONFIG } from '../config/env.js';
import { isAllowedDocUrl, safeFilename } from '../utils/http.js';
import { request as undiciRequest } from 'undici';

export const pdfRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/api/pdf', async (request, reply) => {
    const { url } = request.query as { url?: string };
    if (!url || !isAllowedDocUrl(url)) {
      return reply.code(400).send({ error: 'URL inválida ou não permitida.' });
    }

    const { statusCode, headers, body } = await undiciRequest(url);

    if (statusCode !== 200) {
      return reply.code(statusCode).send(body);
    }

    const fileName = safeFilename(url.split('/').pop() || 'boleto.pdf');
    const frameAncestors =
      CONFIG.FRAME_ANCESTORS_LIST.length > 0
        ? `frame-ancestors ${CONFIG.FRAME_ANCESTORS_LIST.join(' ')}`
        : 'frame-ancestors *';

    reply
      .header('Content-Type', headers['content-type'] || 'application/pdf')
      .header('Content-Disposition', `inline; filename="${fileName}"`)
      .header('Cache-Control', 'private, max-age=300')
      .header('Content-Security-Policy', frameAncestors);

    return reply.send(body);
  });

  fastify.get('/api/pdf-download', async (request, reply) => {
    const { url } = request.query as { url?: string };
    if (!url || !isAllowedDocUrl(url)) {
      return reply.code(400).send({ error: 'URL inválida ou não permitida.' });
    }

    const { statusCode, headers, body } = await undiciRequest(url);
    if (statusCode !== 200) return reply.code(statusCode).send(body);

    const fileName = safeFilename(url.split('/').pop() || 'boleto.pdf');
    reply
      .header('Content-Type', headers['content-type'] || 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${fileName}"`)
      .header('Cache-Control', 'no-store');

    return reply.send(body);
  });
};
