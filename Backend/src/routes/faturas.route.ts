import type { FastifyPluginAsync } from 'fastify';
import { getToken } from '../services/token.js';
import { onlyDigits } from '../utils/strings.js';
import { requireOkJson } from '../utils/http.js';
import { consultarPessoaPorDocumento } from '../services/pessoas.js';

const API_FATURAS =
  'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177_busca_dados_fatura_aberto';

interface FaturasBody {
  cpfCnpj?: string;
  cnpj?: string;
  contrato?: string;
  data_nascimento_titular?: string;
  cpf_resp_financeiro?: string;
}

interface UnimedFaturasResponse {
  content?: any[];
}

export const faturasRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: FaturasBody }>('/api/faturas', async (request, reply) => {
    const { cpfCnpj, cnpj, contrato, data_nascimento_titular, cpf_resp_financeiro } = request.body || {};

    const cpfCnpjDigits = onlyDigits(cpfCnpj || '');
    const contratoDigits = onlyDigits(contrato || '');
    const dataNascDigits = onlyDigits(data_nascimento_titular || '');
    const cpfRespDigitado = onlyDigits(cpf_resp_financeiro || '');

    if (!cpfCnpjDigits) {
      return reply.code(400).send({ error: 'cpfCnpj é obrigatório.' });
    }

    try {
      const pessoa = await consultarPessoaPorDocumento(cpfCnpjDigits);

      if (!pessoa) {
        return reply.code(404).send({ error: 'Cadastro não encontrado.' });
      }

      const isPJ = String(pessoa.tipo_plano || '').trim().toUpperCase() === 'PJ';
      const possuiResp = String(pessoa.possui_resp_financeiro || '').trim().toUpperCase() === 'S';
      const cpfRespNoBanco = onlyDigits(pessoa.cpf_resp_financeiro || '');
      const temNomeResp = Boolean(pessoa.nome_resp_financeiro?.trim());

      if (isPJ) {
        if (!contratoDigits) {
          return reply.code(400).send({ error: 'Número do contrato é obrigatório para pessoa jurídica.' });
        }

        const cnpjCadastro = onlyDigits(pessoa.cnpj_caepf_empresa || '');
        const cnpjInformado = onlyDigits(cnpj || '');
        const cnpjEnvio = cnpjCadastro || cnpjInformado;

        if (possuiResp && temNomeResp && cpfRespNoBanco) {
          if (!cpfRespDigitado) {
            return reply.code(400).send({
              step: 'NEED_CPF_RESP',
              nome_resp_financeiro: pessoa.nome_resp_financeiro,
              message: 'Este plano possui responsável financeiro. Informe o CPF do pagador.',
            });
          }
          if (cpfRespDigitado !== cpfRespNoBanco) {
            return reply.code(401).send({
              error: 'Acesso negado.',
              message: 'O CPF do responsável informado não confere com o cadastro.',
            });
          }
        }

        const token = await getToken();
        const payload: Record<string, string> = {
          cpfCnpj: cpfCnpjDigits,
          cnpj: cnpjEnvio,
          contrato: contratoDigits,
        };

        if (possuiResp && temNomeResp && cpfRespDigitado && cpfRespNoBanco && cpfRespDigitado === cpfRespNoBanco) {
          payload.cpf_resp_financeiro = cpfRespDigitado;
        }

        const data = await requireOkJson<UnimedFaturasResponse>(API_FATURAS, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        const content = Array.isArray(data?.content) ? data.content : [];

        fastify.log.info({
          msg: 'Busca de faturas PJ realizada',
          titular: pessoa.nome_titular,
          empresa: pessoa.nome_empresa,
          contrato: contratoDigits,
          totalFaturas: content.length,
        });

        return {
          content,
          nome_empresa: pessoa.nome_empresa || '',
          info: {
            nome: pessoa.nome_titular,
            tipo: pessoa.tipo_plano,
            empresa: pessoa.nome_empresa || '',
          },
        };
      }

      if (!dataNascDigits) {
        return reply.code(400).send({ error: 'Data de nascimento é obrigatória para pessoa física.' });
      }

      const dataNascCadastro = onlyDigits(pessoa.data_nascimento_titular || '');
      if (dataNascDigits !== dataNascCadastro) {
        return reply.code(400).send({ error: 'Data de nascimento incorreta.' });
      }

      if (possuiResp && temNomeResp) {
        if (!cpfRespDigitado) {
          return reply.code(400).send({
            step: 'NEED_CPF_RESP',
            nome_resp_financeiro: pessoa.nome_resp_financeiro,
            message: 'Este plano possui responsável financeiro. Informe o CPF do pagador.',
          });
        }

        if (cpfRespDigitado !== cpfRespNoBanco) {
          return reply.code(401).send({
            error: 'Acesso negado.',
            message: 'O CPF do responsável informado não confere com o cadastro.',
          });
        }
      }

      const token = await getToken();
      const documentoConsulta = possuiResp && cpfRespDigitado ? cpfRespDigitado : cpfCnpjDigits;
      const payload: Record<string, any> = { cpf: documentoConsulta };

      if (possuiResp && cpfRespDigitado) {
      } else {
        payload.data_nascimento = pessoa.data_nascimento_titular;
      }

      const data = await requireOkJson<UnimedFaturasResponse>(API_FATURAS, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const content = Array.isArray(data?.content) ? data.content : [];

      fastify.log.info({
        msg: 'Busca de faturas PF realizada',
        titular: pessoa.nome_titular,
        possuiResp,
        totalFaturas: content.length,
      });

      return {
        content,
        info: {
          nome: pessoa.nome_titular,
          tipo: pessoa.tipo_plano,
          empresa: 'PLANO PF',
        },
      };
    } catch (error: any) {
      fastify.log.error(error);
      const msg = error?.message || 'Erro ao processar validação.';
      return reply.code(500).send({ error: msg });
    }
  });
};