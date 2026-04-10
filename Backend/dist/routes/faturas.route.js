import { getToken } from '../services/token.js';
import { onlyDigits } from '../utils/strings.js';
import { requireOkJson } from '../utils/http.js';
import { consultarPessoaPorDocumento } from '../services/pessoas.js';
const API_FATURAS = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177_busca_dados_fatura_aberto';
export const faturasRoute = async (fastify) => {
    fastify.post('/api/faturas', async (request, reply) => {
        const started = Date.now();
        const { cpfCnpj, contrato, data_nascimento_titular, cpf_resp } = request.body || {};
        const cpfCnpjDigits = onlyDigits(cpfCnpj || '');
        const contratoDigits = onlyDigits(contrato || '');
        const dataNascDigits = onlyDigits(data_nascimento_titular || '');
        const cpfRespDigits = onlyDigits(cpf_resp || '');
        if (!cpfCnpjDigits) {
            return reply.code(400).send({ error: 'O CPF ou CNPJ é obrigatório.' });
        }
        try {
            const pessoa = await consultarPessoaPorDocumento(cpfCnpjDigits);
            if (!pessoa) {
                return reply.code(404).send({
                    error: 'Cadastro não encontrado',
                    message: 'Não localizamos este documento na base da Unimed.'
                });
            }
            // Extração de metadados do cadastro
            const isPJ = pessoa.tipo_plano === 'PJ';
            const possuiResp = pessoa.possui_resp_financeiro === 'S';
            // Valores formatados para comparação e envio
            const registroAnsDb = onlyDigits(pessoa.registro_ans || '');
            const dataNascDbRaw = pessoa.data_nascimento_titular; // Com barras: "24/03/2021"
            const dataNascDbDigits = onlyDigits(dataNascDbRaw || '');
            const cpfRespDbDigits = onlyDigits(pessoa.cpf_resp_financeiro || '');
            // --- BLOCO DE VALIDAÇÃO DE ACESSO ---
            if (isPJ) {
                if (!contratoDigits) {
                    return reply.code(400).send({ step: 'NEED_CONTRATO', message: 'Informe o número do contrato empresarial.' });
                }
                if (contratoDigits !== registroAnsDb) {
                    return reply.code(400).send({ error: 'Contrato não confere com este CNPJ.' });
                }
            }
            else {
                if (!dataNascDigits) {
                    return reply.code(400).send({ error: 'Data de nascimento é obrigatória.' });
                }
                if (dataNascDigits !== dataNascDbDigits) {
                    return reply.code(400).send({ error: 'Data de nascimento incorreta.' });
                }
                if (possuiResp) {
                    if (!cpfRespDigits) {
                        return reply.code(400).send({ step: 'NEED_CPF_RESP', message: 'Informe o CPF do responsável financeiro.' });
                    }
                    if (cpfRespDigits !== cpfRespDbDigits) {
                        return reply.code(400).send({ error: 'CPF do responsável financeiro não confere.' });
                    }
                }
            }
            // --- PREPARAÇÃO DO PAYLOAD EXTERNO ---
            const token = await getToken();
            /**
             * REGRA DE OURO:
             * Para listar as faturas do dependente (Heytor), enviamos o CPF do RESPONSÁVEL.
             * O campo 'contrato' para PF deve conter a DATA DE NASCIMENTO COM BARRAS.
             */
            const documentoBusca = (!isPJ && possuiResp) ? cpfRespDbDigits : cpfCnpjDigits;
            const segundoFatorBusca = isPJ ? registroAnsDb : dataNascDbRaw;
            const payload = {
                cpfCnpj: documentoBusca,
                contrato: segundoFatorBusca
            };
            const data = await requireOkJson(API_FATURAS, {
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
                solicitante: cpfCnpjDigits,
                enviadoParaUnimed: payload, // Verifique este payload no log se continuar vindo 0
                itens: content.length,
                tempo: `${Date.now() - started}ms`,
            });
            return {
                content,
                info: {
                    nome: pessoa.nome_titular,
                    tipo: pessoa.tipo_plano,
                    empresa: pessoa.nome_empresa || 'PLANO PF'
                }
            };
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({
                error: 'Erro de processamento',
                message: 'Falha ao validar dados ou buscar faturas.'
            });
        }
    });
};
