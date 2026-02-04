import type { FastifyPluginAsync } from 'fastify';
import { consultarPessoaPorDocumento } from '../services/pessoas.js';
import { validarNomeBenef } from '../services/validacao.js';

async function doLookup(documento?: string) {
  if (!documento) return { status: 400, payload: { error: 'documento obrigatorio' } };

  try {
    const pessoa = await consultarPessoaPorDocumento(documento);
    if (!pessoa) return { status: 404, payload: { error: 'Pessoa não encontrada' } };

    return {
      status: 200,
      payload: pessoa,
    };
  } catch (e: any) {
    return { status: 502, payload: { error: e?.message || 'Falha ao consultar pessoa' } };
  }
}

export const identificacaoRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/api/identificacao/lookup', async (request, reply) => {
    const { documento } = request.body as { documento?: string };
    const { status, payload } = await doLookup(documento);
    return reply.code(status).send(payload);
  });

  fastify.get('/api/identificacao/lookup', async (request, reply) => {
    const documento = (request.query as any)?.documento as string | undefined;
    const { status, payload } = await doLookup(documento);
    return reply.code(status).send(payload);
  });

  fastify.post('/api/identificacao/validar', async (request, reply) => {
    try {
      const body = (request.body as any) || {};
      const pessoa = await validarNomeBenef(body);
      if (!pessoa) return reply.code(404).send({ error: 'Pessoa não encontrada' });

      return reply.send({
        ...pessoa,
      });
    } catch (e: any) {
      return reply.code(500).send({ error: e?.message || 'Falha na validacao' });
    }
  });
};
