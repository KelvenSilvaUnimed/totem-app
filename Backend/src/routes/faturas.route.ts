import type { FastifyPluginAsync } from 'fastify';
import { getToken } from '../services/token';
import { onlyDigits } from '../utils/strings';
import { requireOkJson } from '../utils/http';


const API_FATURAS = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/0177_busca_dados_fatura_aberto';


export const faturasRoute: FastifyPluginAsync = async (fastify) => {
fastify.post('/api/faturas', async (request, reply) => {
const started = Date.now();
const body = request.body as { cpfCnpj?: string; contrato?: string };
const { cpfCnpj, contrato } = body ?? {};


if (!cpfCnpj || !contrato) {
return reply.code(400).send({ error: 'cpfCnpj e contrato são obrigatórios' });
}


const token = await getToken();
const payload = {
CNPJ: Number(onlyDigits(cpfCnpj)),
CONTRATO: Number(onlyDigits(contrato))
};


type Resp = { content?: unknown[] };
const data = await requireOkJson<Resp>(API_FATURAS, {
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