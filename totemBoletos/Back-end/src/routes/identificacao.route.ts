import type { FastifyPluginAsync } from 'fastify';
import { consultarPessoaPorDocumento } from '../services/pessoas.js';

function mapTipoPessoa(t?: string): 'PF' | 'PJ' {
  return t === 'J' ? 'PJ' : 'PF';
}

async function doLookup(documento?: string) {
  if (!documento) return { status: 400, payload: { error: 'documento é obrigatório' } };

  const pessoa = await consultarPessoaPorDocumento(documento);
  if (!pessoa) return { status: 404, payload: { error: 'Pessoa não encontrada' } };

  const tipoPessoa = mapTipoPessoa(pessoa.tip_pessoa);
  const exige = tipoPessoa === 'PF' ? 'dt_nasc' : 'contrato';

  return {
    status: 200,
    payload: {
      documento,
      nome: pessoa.nome_pessoa ?? null,
      tipoPessoa,
      exige, // dica pro front do totem: qual próximo campo pedir
      contrato: pessoa.contrato ?? null,
      cod_pessoa: pessoa.cod_pessoa ?? null,
      dt_nasc: pessoa.dt_nasc ?? null, // pode ajudar na validação PF
      carteirinha: pessoa.carteirinha ?? null,
    },
  };
}

export const identificacaoRoute: FastifyPluginAsync = async (fastify) => {
  // POST /api/identificacao/lookup  { documento }
  fastify.post('/api/identificacao/lookup', async (request, reply) => {
    const { documento } = request.body as { documento?: string };
    const { status, payload } = await doLookup(documento);
    return reply.code(status).send(payload);
  });

  // GET /api/identificacao/lookup?documento=...
  fastify.get('/api/identificacao/lookup', async (request, reply) => {
    const documento = (request.query as any)?.documento as string | undefined;
    const { status, payload } = await doLookup(documento);
    return reply.code(status).send(payload);
  });
};
