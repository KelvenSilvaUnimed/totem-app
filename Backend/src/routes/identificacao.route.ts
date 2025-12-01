import type { FastifyPluginAsync } from 'fastify';
import { consultarPessoaPorDocumento } from '../services/pessoas.js';
import { validarNomeBenef } from '../services/validacao.js';

function mapTipoPessoa(t?: string): 'PF' | 'PJ' {
  return t === 'J' ? 'PJ' : 'PF';
}

async function doLookup(documento?: string) {
  if (!documento) return { status: 400, payload: { error: 'documento Ǹ obrigat��rio' } };

  try {
    const pessoa = await consultarPessoaPorDocumento(documento);
    if (!pessoa) return { status: 404, payload: { error: 'Pessoa nǜo encontrada' } };

    const tipoPessoa = mapTipoPessoa(pessoa.tip_pessoa);
    const exige = tipoPessoa === 'PF' ? 'dt_nasc' : 'contrato';

    return {
      status: 200,
      payload: {
        documento,
        nome: pessoa.nome_pessoa ?? null,
        tipoPessoa,
        exige, // dica pro front do totem: qual proximo campo pedir
        contrato: pessoa.contrato ?? null,
        cod_pessoa: pessoa.cod_pessoa ?? null,
        dt_nasc: pessoa.dt_nasc ?? null, // pode ajudar na validacao PF
        carteirinha: pessoa.carteirinha ?? null,
      },
    };
  } catch (e: any) {
    return { status: 502, payload: { error: e?.message || 'Falha ao consultar pessoa' } };
  }
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

  // POST /api/identificacao/validar  { ...payload livre para a API 0177-valida-nome-benef }
  fastify.post('/api/identificacao/validar', async (request, reply) => {
    try {
      const body = (request.body as any) || {};
      const pessoa = await validarNomeBenef(body);
      if (!pessoa) return reply.code(404).send({ error: 'Pessoa nǜo encontrada' });

      const tipoPessoa = mapTipoPessoa(pessoa.tip_pessoa);
      const exige = tipoPessoa === 'PF' ? 'dt_nasc' : 'contrato';

      return reply.send({
        documento: body?.documento ?? pessoa?.doc_pessoa_s_formatacao ?? pessoa?.doc_pessoa_formatado ?? null,
        nome: pessoa?.nome_pessoa ?? null,
        tipoPessoa,
        exige,
        contrato: pessoa?.contrato ?? null,
        cod_pessoa: pessoa?.cod_pessoa ?? null,
        dt_nasc: pessoa?.dt_nasc ?? null,
        carteirinha: pessoa?.carteirinha ?? null,
      });
    } catch (e: any) {
      return reply.code(500).send({ error: e?.message || 'Falha na validacao' });
    }
  });
};
