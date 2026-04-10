import type { FastifyPluginAsync } from 'fastify';
import { getToken } from '../services/token.js';
import { onlyDigits } from '../utils/strings.js';
import { requireOkJson } from '../utils/http.js';
import { consultarPessoaPorDocumento } from '../services/pessoas.js';

const API_FATURAS = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177_busca_dados_fatura_aberto';

interface FaturasBody {
  cpfCnpj?: string;
  contrato?: string;
  data_nascimento_titular?: string;
  cpf_resp?: string;
}

interface UnimedResponse {
  content?: any[];
}

export const faturasRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: FaturasBody }>('/api/faturas', async (request, reply) => {
    const started = Date.now();
    const { cpfCnpj, data_nascimento_titular, cpf_resp } = request.body || {};

    // Limpamos o que o usuário digitou no Totem
    const cpfCnpjDigits = onlyDigits(cpfCnpj || '');
    const dataNascDigits = onlyDigits(data_nascimento_titular || '');
    const cpfRespDigitado = onlyDigits(cpf_resp || '');

    try {
      // 1. Busca os dados reais no banco (Serviço Pessoas)
      const pessoa = await consultarPessoaPorDocumento(cpfCnpjDigits);
      
      if (!pessoa) {
        return reply.code(404).send({ error: 'Cadastro não encontrado' });
      }

      // 2. Validação da Data de Nascimento (Sempre obrigatória para PF)
      if (dataNascDigits !== onlyDigits(pessoa.data_nascimento_titular || '')) {
        return reply.code(400).send({ error: 'Data de nascimento incorreta.' });
      }

      const isPJ = pessoa.tipo_plano === 'PJ';
      const possuiResp = pessoa.possui_resp_financeiro === 'S';
      const cpfRespNoBanco = onlyDigits(pessoa.cpf_resp_financeiro || '');

      // 3. NOVA TRAVA: Validação do CPF do Responsável
      if (!isPJ && possuiResp) {
        if (!cpfRespDigitado) {
          return reply.code(400).send({ 
            step: 'NEED_CPF_RESP', 
            message: 'Este plano possui responsável financeiro. Informe o CPF do pagador.' 
          });
        }

        // Compara o que foi digitado com o que está no banco de dados
        if (cpfRespDigitado !== cpfRespNoBanco) {
          return reply.code(401).send({ 
            error: 'Acesso negado', 
            message: 'O CPF do responsável informado não confere com o cadastro deste beneficiário.' 
          });
        }
      }

      // 4. Preparação para a API do Fornecedor
      const token = await getToken();
      const chaveDocumento = isPJ ? 'cnpj' : 'cpf';
      
      let documentoEnvio: string;
      let contratoEnvio: string | undefined;

      if (isPJ) {
        documentoEnvio = cpfCnpjDigits;
        contratoEnvio = onlyDigits(pessoa.registro_ans || '');
      } else if (possuiResp) {
        // Se passou na validação acima, usamos o CPF que foi validado
        documentoEnvio = cpfRespNoBanco;
        contratoEnvio = undefined; 
      } else {
        documentoEnvio = cpfCnpjDigits;
        contratoEnvio = pessoa.data_nascimento_titular;
      }

      const payload: Record<string, any> = {
        [chaveDocumento]: documentoEnvio
      };

      if (contratoEnvio) {
        payload.contrato = contratoEnvio;
      }

      // 5. Chamada à API
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
        msg: 'Busca de faturas realizada',
        titular: pessoa.nome_titular,
        buscadoPor: documentoEnvio,
        status: 'Sucesso'
      });

      return { 
        content,
        info: { 
          nome: pessoa.nome_titular, 
          tipo: pessoa.tipo_plano,
          empresa: pessoa.nome_empresa || 'PLANO PF'
        } 
      };

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Erro ao processar validação.' });
    }
  });
};