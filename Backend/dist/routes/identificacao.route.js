"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.identificacaoRoute = void 0;
const pessoas_js_1 = require("../services/pessoas.js");
const validacao_js_1 = require("../services/validacao.js");
function mapTipoPessoa(t) {
    return t === 'J' ? 'PJ' : 'PF';
}
async function doLookup(documento) {
    if (!documento)
        return { status: 400, payload: { error: 'documento obrigatorio' } };
    try {
        const pessoa = await (0, pessoas_js_1.consultarPessoaPorDocumento)(documento);
        if (!pessoa)
            return { status: 404, payload: { error: 'Pessoa não encontrada' } };
        const tipoPessoa = mapTipoPessoa(pessoa.tip_pessoa);
        const exige = tipoPessoa === 'PF' ? 'dt_nasc' : 'contrato';
        return {
            status: 200,
            payload: {
                documento,
                nome: pessoa.nome_pessoa ?? null,
                tipoPessoa,
                exige,
                contrato: pessoa.contrato ?? null,
                cod_pessoa: pessoa.cod_pessoa ?? null,
                dt_nasc: pessoa.dt_nasc ?? null,
                carteirinha: pessoa.carteirinha ?? null,
            },
        };
    }
    catch (e) {
        return { status: 502, payload: { error: e?.message || 'Falha ao consultar pessoa' } };
    }
}
const identificacaoRoute = async (fastify) => {
    fastify.post('/api/identificacao/lookup', async (request, reply) => {
        const { documento } = request.body;
        const { status, payload } = await doLookup(documento);
        return reply.code(status).send(payload);
    });
    fastify.get('/api/identificacao/lookup', async (request, reply) => {
        const documento = request.query?.documento;
        const { status, payload } = await doLookup(documento);
        return reply.code(status).send(payload);
    });
    fastify.post('/api/identificacao/validar', async (request, reply) => {
        try {
            const body = request.body || {};
            const pessoa = await (0, validacao_js_1.validarNomeBenef)(body);
            if (!pessoa)
                return reply.code(404).send({ error: 'Pessoa não encontrada' });
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
        }
        catch (e) {
            return reply.code(500).send({ error: e?.message || 'Falha na validacao' });
        }
    });
};
exports.identificacaoRoute = identificacaoRoute;
