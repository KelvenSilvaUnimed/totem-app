"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.faturasRoute = void 0;
const token_1 = require("../services/token");
const strings_1 = require("../utils/strings");
const http_1 = require("../utils/http");
const API_FATURAS = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177_busca_dados_fatura_aberto';
const faturasRoute = async (fastify) => {
    fastify.post('/api/faturas', async (request, reply) => {
        const started = Date.now();
        const body = request.body;
        const { cpfCnpj, contrato } = body ?? {};
        if (!cpfCnpj || !contrato) {
            return reply.code(400).send({ error: 'cpfCnpj e contrato são obrigatórios' });
        }
        const token = await (0, token_1.getToken)();
        const payload = {
            CNPJ: Number((0, strings_1.onlyDigits)(cpfCnpj)),
            CONTRATO: Number((0, strings_1.onlyDigits)(contrato))
        };
        const data = await (0, http_1.requireOkJson)(API_FATURAS, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const content = Array.isArray(data?.content) ? data.content : [];
        fastify.log.info(`/api/faturas -> ${content.length} itens [${Date.now() - started}ms]`);
        return { content };
    });
};
exports.faturasRoute = faturasRoute;
