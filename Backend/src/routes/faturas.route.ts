import type { FastifyPluginAsync } from 'fastify';
import { getToken } from '../services/token.js';
import { onlyDigits } from '../utils/strings.js';
import { requireOkJson } from '../utils/http.js';
import { consultarPessoaPorDocumento } from '../services/pessoas.js';

const API_FATURAS = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177_busca_dados_fatura_aberto';

interface FaturasBody {
  cpfCnpj?: string;
  contrato?: string;
  /** Alternativa ao contrato (fluxo PJ): data do titular em DD/MM/AAAA ou 8 dígitos DDMMAAAA. */
  data_nascimento_titular?: string;
}

interface UnimedResponse {
  content?: unknown[];
}

export const faturasRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: FaturasBody }>('/api/faturas', async (request, reply) => {
    const started = Date.now();
    const { cpfCnpj, contrato, data_nascimento_titular } = request.body || {};

    const cpfCnpjDigits = onlyDigits(cpfCnpj || '');
    const contratoDigits = onlyDigits(contrato || '');
    const dataNascDigits = onlyDigits(data_nascimento_titular || '');
    const segundoParametro = contratoDigits || dataNascDigits;

    if (!cpfCnpjDigits || !segundoParametro) {
      return reply.code(400).send({
        error: 'Dados incompletos',
        message:
          'Para buscar faturas, informe o CPF/CNPJ e o número do contrato, ou a data de nascimento do titular (fluxo PJ).',
      });
    }

    const token = await getToken();

    const isPj = cpfCnpjDigits.length > 11;
    /** A procedure Unimed usa o campo `contrato` também para receber DDMMAAAA na validação PJ. */
    const payload = { cpfCnpj: cpfCnpjDigits, contrato: segundoParametro };

    try {
      /**
       * Proteção: evita vazamento de dados quando alguém combina um CPF válido com um contrato de terceiro.
       * Quando o identificador é CPF (11 dígitos) e a chamada está usando contrato,
       * validamos se o contrato informado confere com o `registro_ans` do cadastro.
       */
      if (cpfCnpjDigits.length === 11 && contratoDigits) {
        const pessoa = await consultarPessoaPorDocumento(cpfCnpjDigits);
        const contratoCadastro = onlyDigits(pessoa?.registro_ans || '');
        if (contratoCadastro && contratoCadastro !== contratoDigits) {
          return reply.code(400).send({
            error: 'Contrato inválido',
            message: 'O número do contrato informado não possui vínculo com o CPF.',
          });
        }
      }

      const data = await requireOkJson<UnimedResponse>(API_FATURAS, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const content = Array.isArray(data?.content) ? data.content : [];

      fastify.log.info({
        msg: '/api/faturas',
        tipo: isPj ? 'PJ' : 'PF',
        payloadEnviado: payload,
        itens: content.length,
        tempo: `${Date.now() - started}ms`,
      });

      return { content };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(502).send({
        error: 'Erro na busca',
        message: 'Não foi possível buscar as faturas. Verifique se o número do contrato está correto.',
      });
    }
  });
};
