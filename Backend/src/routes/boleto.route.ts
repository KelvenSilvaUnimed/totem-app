import type { FastifyPluginAsync } from 'fastify';
import { getToken } from '../services/token';
import { requireOkJson, isAllowedDocUrl, safeFilename } from '../utils/http';
import { request as undiciRequest } from 'undici';



const API_BOLETO = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/p_0177_json_busca_boleto';


export const boletoRoute: FastifyPluginAsync = async (fastify) => {
  // POST /api/boleto — busca a URL do boleto
fastify.post('/api/boleto', async (request, reply) => {
const started = Date.now();
const body = request.body as { numeroFatura?: string | number };
const { numeroFatura } = body ?? {};


if (!numeroFatura) {
return reply.code(400).send({ error: 'numeroFatura é obrigatório' });
}


type Resp = { content?: Array<{ url?: string }> };
const token = await getToken();
const data = await requireOkJson<Resp>(API_BOLETO, {
method: 'POST',
headers: {
Authorization: `Bearer ${token}`,
'Content-Type': 'application/json'
},
body: JSON.stringify({ numeroFatura: Number(numeroFatura) })
});


const first = Array.isArray(data?.content) ? data.content[0] : null;
const url = first?.url || null;
fastify.log.info(`/api/boleto -> ${url ? 'OK' : 'NOK'} [${Date.now() - started}ms]`);
return { url };
});


  // POST /api/send-boleto — envia o link do boleto por e-mail
fastify.post('/api/send-boleto', async (request, reply) => {
const body = request.body as { email?: string; url?: string; numeroFatura?: string | number };
const { email, url, numeroFatura } = body ?? {};


if (!email || !url) return reply.code(400).send({ error: 'email e url são obrigatórios' });
if (!fastify.mailer) return reply.code(500).send({ error: 'SMTP não configurado no servidor.' });


const subject = `Boleto ${numeroFatura ? `- Fatura ${numeroFatura}` : ''}`.trim();
const proxyLink = `${request.protocol}://${request.headers.host}/api/pdf?url=${encodeURIComponent(url)}`;


const html = `
<p>Olá,</p>
<p>Segue o link para visualizar/baixar seu boleto ${numeroFatura ? `da fatura <strong>${numeroFatura}</strong>` : ''}:</p>
<p><a href="${url}" target="_blank" rel="noreferrer">${url}</a></p>
<p>Ou visualize via proxy:</p>
<p><a href="${proxyLink}" target="_blank" rel="noreferrer">${proxyLink}</a></p>
<p>Atenciosamente,<br/>Unimed Patos de Minas</p>
`;


await fastify.mailer.sendMail({ from: process.env.MAIL_FROM, to: email, subject, html });
return { ok: true };
});

  // GET /api/pdf?url=... -> proxy para visualização inline (iframe)
  fastify.get('/api/pdf', async (request, reply) => {
    const { url } = request.query as { url?: string };
    if (!url || !isAllowedDocUrl(url)) {
      return reply.code(400).send({ error: 'URL inválida ou não permitida.' });
    }

    const { statusCode, headers, body } = await undiciRequest(url);

    if (statusCode !== 200) {
      return reply.code(statusCode).send(body);
    }

    const fileName = safeFilename(url.split('/').pop() || 'boleto.pdf');
    reply
      .header('Content-Type', headers['content-type'] || 'application/pdf')
      .header('Content-Disposition', `inline; filename="${fileName}"`)
      .header('Cache-Control', 'private, max-age=300')
      .header('Content-Security-Policy', "frame-ancestors *"); // Permite o iframe em qualquer origem

    return reply.send(body);
  });

  // GET /api/pdf-download?url=... -> proxy para forçar o download
  fastify.get('/api/pdf-download', async (request, reply) => {
    const { url } = request.query as { url?: string };
    if (!url || !isAllowedDocUrl(url)) {
      return reply.code(400).send({ error: 'URL inválida ou não permitida.' });
    }

    const { statusCode, headers, body } = await undiciRequest(url);
    if (statusCode !== 200) return reply.code(statusCode).send(body);

    const fileName = safeFilename(url.split('/').pop() || 'boleto.pdf');
    reply
      .header('Content-Type', headers['content-type'] || 'application/pdf')
      .header('Content-Disposition', `attachment; filename="${fileName}"`)
      .header('Cache-Control', 'no-store');

    return reply.send(body);
  });
};