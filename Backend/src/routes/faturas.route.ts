import type { FastifyPluginAsync } from 'fastify';
import { getToken } from '../services/token';
import { onlyDigits } from '../utils/strings';
import { requireOkJson } from '../utils/http';

const API_FATURAS = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177_busca_dados_fatura_aberto';

interface FaturasBody {
  cpfCnpj?: string;
  contrato?: string;
}

interface UnimedResponse {
  content?: unknown[];
}

export const faturasRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: FaturasBody }>('/api/faturas', async (request, reply) => {
    const started = Date.now();
    const { cpfCnpj, contrato } = request.body || {};

    if (!cpfCnpj || !contrato) {
      return reply.code(400).send({ 
        error: 'Dados incompletos',
        message: 'Para buscar faturas, o CPF/CNPJ e o número do contrato são obrigatórios.' 
      });
    }

    const token = await getToken();
    const cpfCnpjDigits = onlyDigits(cpfCnpj);
    const contratoDigits = onlyDigits(contrato);

    const isPj = cpfCnpjDigits.length > 11;

    let payload: Record<string, any>;

    if (isPj) {
        payload = {
            cpfCnpj: cpfCnpjDigits,
            contrato: contratoDigits,
        };
    } else {
        payload = {
            contrato: contratoDigits, 
        };
    }

    try {
      const data = await requireOkJson<UnimedResponse>(API_FATURAS, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const content = Array.isArray(data?.content) ? data.content : [];
      
      fastify.log.info({
          msg: '/api/faturas',
          tipo: isPj ? 'PJ' : 'PF',
          payloadEnviado: payload,
          itens: content.length,
          tempo: `${Date.now() - started}ms`
      });
      
      return { content };

    } catch (error) {
      fastify.log.error(error);
      return reply.code(502).send({ 
        error: 'Erro na busca', 
        message: 'Não foi possível buscar as faturas. Verifique se o número do contrato está correto.' 
      });
    }
  });
};