import net from 'node:net';
import os from 'node:os';
import ipp from 'ipp';
import { fetch as undiciFetch, request as undiciRequest } from 'undici';
import { CONFIG } from '../config/env.js';
import { getToken } from '../services/token.js';
import { isAllowedDocUrl, requireOkJson, safeFilename } from '../utils/http.js';
const API_BOLETO = 'https://api.unimedpatos.sgusuite.com.br/api/procedure/p_prcssa_dados/p_0177_json_busca_boleto';
const printMetrics = {
    total: 0,
    ok: 0,
    error: 0,
};
async function buscarUrlBoleto(numeroFatura) {
    const token = await getToken();
    const data = await requireOkJson(API_BOLETO, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numeroFatura: Number(numeroFatura) }),
    });
    const first = Array.isArray(data?.content) ? data.content[0] : null;
    const url = typeof first?.url === 'string' ? first.url : undefined;
    return url;
}
async function downloadPdfBuffer(url) {
    const { statusCode, body } = await undiciRequest(url);
    if (statusCode !== 200) {
        throw new Error(`Falha ao baixar PDF (${statusCode})`);
    }
    const chunks = [];
    for await (const chunk of body) {
        chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
}
async function sendToNetworkPrinter(buffer) {
    if (!CONFIG.PRINT_HOST) {
        throw new Error('PRINT_HOST n�o configurado.');
    }
    const host = CONFIG.PRINT_HOST;
    const port = CONFIG.PRINT_PORT || 9100;
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.once('error', reject);
        socket.connect(port, host, () => {
            socket.write(buffer, (err) => {
                if (err) {
                    socket.destroy();
                    reject(err);
                    return;
                }
                socket.end();
                resolve();
            });
        });
    });
}
async function sendToLprPrinter(buffer, fileName) {
    if (!CONFIG.PRINT_HOST) {
        throw new Error('PRINT_HOST n�o configurado.');
    }
    if (!CONFIG.PRINT_QUEUE) {
        throw new Error('PRINT_QUEUE n�o configurado para LPR.');
    }
    const host = CONFIG.PRINT_HOST;
    const port = CONFIG.PRINT_PORT || 515;
    const queue = CONFIG.PRINT_QUEUE;
    const hostname = os.hostname().replace(/\s+/g, '-') || 'totem';
    const user = 'totem';
    const jobId = String(Date.now()).slice(-3);
    const controlFileName = `cfA${jobId}${hostname}`;
    const dataFileName = `dfA${jobId}${hostname}`;
    const controlContent = `H${hostname}\nP${user}\nN${fileName}\n`;
    const writeAndWaitAck = (socket, data) => new Promise((resolve, reject) => {
        socket.write(data, (err) => {
            if (err)
                return reject(err);
            socket.once('data', (ack) => {
                if (ack[0] === 0)
                    return resolve();
                reject(new Error(`LPR NACK (${ack[0]})`));
            });
        });
    });
    return new Promise((resolve, reject) => {
        const socket = new net.Socket();
        socket.once('error', reject);
        socket.connect(port, host, async () => {
            try {
                await writeAndWaitAck(socket, Buffer.from(`\x02${queue}\n`, 'binary'));
                const controlHeader = Buffer.from(`\x02${Buffer.byteLength(controlContent)} ${controlFileName}\n`, 'binary');
                await writeAndWaitAck(socket, controlHeader);
                await writeAndWaitAck(socket, Buffer.concat([Buffer.from(controlContent, 'binary'), Buffer.from([0])]));
                const dataHeader = Buffer.from(`\x03${buffer.length} ${dataFileName}\n`, 'binary');
                await writeAndWaitAck(socket, dataHeader);
                await writeAndWaitAck(socket, Buffer.concat([buffer, Buffer.from([0])]));
                socket.end();
                resolve();
            }
            catch (err) {
                socket.destroy();
                reject(err);
            }
        });
    });
}
async function sendToIppPrinter(buffer, fileName) {
    if (!CONFIG.PRINT_HOST) {
        throw new Error('PRINT_HOST n�o configurado.');
    }
    if (!CONFIG.PRINT_QUEUE) {
        throw new Error('PRINT_QUEUE n�o configurado para IPP.');
    }
    const host = CONFIG.PRINT_HOST;
    const port = CONFIG.PRINT_PORT || 631;
    const queue = CONFIG.PRINT_QUEUE;
    const printer = new ipp.Printer(`http://${host}:${port}/printers/${queue}`);
    const msg = {
        'operation-attributes-tag': {
            'attributes-charset': 'utf-8',
            'attributes-natural-language': 'pt-br',
            'printer-uri': printer.uri,
            'requesting-user-name': 'totem',
            'job-name': fileName,
            'document-format': 'application/pdf',
        },
        data: buffer,
    };
    return new Promise((resolve, reject) => {
        printer.execute('Print-Job', msg, (err, res) => {
            if (err)
                return reject(err);
            resolve(res);
        });
    });
}
async function sendToPrintService(payload) {
    if (!CONFIG.PRINT_SERVICE_URL) {
        throw new Error('PRINT_SERVICE_URL n�o configurado.');
    }
    const res = await undiciFetch(CONFIG.PRINT_SERVICE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const t = await res.text().catch(() => '');
        throw new Error(`Falha no servi�o de impress�o: ${res.status} ${t}`);
    }
    const ct = res.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
        return res.json().catch(() => ({}));
    }
    return { ok: true };
}
function logPrintResult(fastify, info) {
    const payload = {
        msg: 'print',
        status: info.status,
        mode: info.mode,
        duration_ms: info.durationMs,
        numeroFatura: info.numeroFatura,
        url: info.url,
        printer: info.printer,
        protocol: info.protocol,
    };
    if (info.status === 'error') {
        fastify.log.error({ ...payload, err: info.error });
    }
    else {
        fastify.log.info(payload);
    }
}
export const boletoRoute = async (fastify) => {
    fastify.post('/api/boleto', async (request, reply) => {
        const started = Date.now();
        const body = request.body;
        const { numeroFatura } = body ?? {};
        if (!numeroFatura) {
            return reply.code(400).send({ error: 'numeroFatura � obrigat�rio' });
        }
        const url = await buscarUrlBoleto(numeroFatura);
        fastify.log.info(`/api/boleto -> ${url ? 'OK' : 'NOK'} [${Date.now() - started}ms]`);
        return { url };
    });
    fastify.post('/api/boleto/proxy', async (request, reply) => {
        const body = request.body;
        const { url } = body ?? {};
        if (!url || !isAllowedDocUrl(url)) {
            return reply.code(400).send({ error: 'URL inv�lida ou n�o permitida.' });
        }
        const { statusCode, headers, body: stream } = await undiciRequest(url);
        if (statusCode !== 200)
            return reply.code(statusCode).send(stream);
        const fileName = safeFilename(url.split('/').pop() || 'boleto.pdf');
        reply
            .header('Content-Type', headers['content-type'] || 'application/pdf')
            .header('Content-Disposition', `inline; filename="${fileName}"`)
            .header('Cache-Control', 'private, max-age=120');
        return reply.send(stream);
    });
    fastify.post('/api/boleto/print', async (request, reply) => {
        const started = Date.now();
        printMetrics.total += 1;
        const body = request.body;
        const { numeroFatura } = body ?? {};
        let { url } = body ?? {};
        try {
            if (!url && !numeroFatura) {
                return reply.code(400).send({ error: 'numeroFatura ou url � obrigat�rio' });
            }
            if (!url && numeroFatura) {
                url = await buscarUrlBoleto(numeroFatura);
            }
            if (!url) {
                return reply.code(404).send({ error: 'Boleto n�o encontrado' });
            }
            if (!isAllowedDocUrl(url)) {
                return reply.code(400).send({ error: 'URL inv�lida ou n�o permitida.' });
            }
            const fileName = safeFilename(url.split('/').pop() || 'boleto.pdf');
            if (CONFIG.PRINT_SERVICE_URL) {
                const data = await sendToPrintService({
                    url,
                    numeroFatura,
                    fileName,
                    queue: CONFIG.PRINT_QUEUE || undefined,
                });
                printMetrics.ok += 1;
                logPrintResult(fastify, {
                    status: 'ok',
                    mode: 'service',
                    durationMs: Date.now() - started,
                    numeroFatura,
                    url,
                    protocol: 'service',
                });
                return reply.send({ ok: true, mode: 'service', data });
            }
            if (CONFIG.PRINT_HOST) {
                const buffer = await downloadPdfBuffer(url);
                const protocol = CONFIG.PRINT_PROTOCOL || 'raw';
                if (protocol === 'lpr') {
                    await sendToLprPrinter(buffer, fileName);
                    printMetrics.ok += 1;
                    logPrintResult(fastify, {
                        status: 'ok',
                        mode: 'lpr',
                        durationMs: Date.now() - started,
                        numeroFatura,
                        url,
                        printer: `${CONFIG.PRINT_HOST}:${CONFIG.PRINT_PORT || 515}`,
                        protocol,
                    });
                    return reply.send({ ok: true, mode: 'lpr' });
                }
                if (protocol === 'ipp') {
                    const data = await sendToIppPrinter(buffer, fileName);
                    printMetrics.ok += 1;
                    logPrintResult(fastify, {
                        status: 'ok',
                        mode: 'ipp',
                        durationMs: Date.now() - started,
                        numeroFatura,
                        url,
                        printer: `${CONFIG.PRINT_HOST}:${CONFIG.PRINT_PORT || 631}`,
                        protocol,
                    });
                    return reply.send({ ok: true, mode: 'ipp', data });
                }
                await sendToNetworkPrinter(buffer);
                printMetrics.ok += 1;
                logPrintResult(fastify, {
                    status: 'ok',
                    mode: 'raw',
                    durationMs: Date.now() - started,
                    numeroFatura,
                    url,
                    printer: `${CONFIG.PRINT_HOST}:${CONFIG.PRINT_PORT || 9100}`,
                    protocol: 'raw',
                });
                return reply.send({
                    ok: true,
                    mode: 'raw',
                    printer: `${CONFIG.PRINT_HOST}:${CONFIG.PRINT_PORT || 9100}`,
                });
            }
            return reply.code(500).send({ error: 'Impress�o n�o configurada no servidor.' });
        }
        catch (error) {
            printMetrics.error += 1;
            printMetrics.lastErrorAt = new Date().toISOString();
            logPrintResult(fastify, {
                status: 'error',
                durationMs: Date.now() - started,
                numeroFatura,
                url,
                protocol: CONFIG.PRINT_PROTOCOL,
                error,
            });
            return reply.code(500).send({ error: error?.message || 'Falha ao imprimir' });
        }
    });
    fastify.post('/api/send-boleto', async (request, reply) => {
        const body = request.body;
        const { email, url, numeroFatura } = body ?? {};
        if (!email || !url)
            return reply.code(400).send({ error: 'email e url s�o obrigat�rios' });
        if (!fastify.mailer)
            return reply.code(500).send({ error: 'SMTP n�o configurado no servidor.' });
        const subject = `Boleto ${numeroFatura ? `- Fatura ${numeroFatura}` : ''}`.trim();
        const proxyLink = `${request.protocol}://${request.headers.host}/api/pdf?url=${encodeURIComponent(url)}`;
        const html = `
<p>Ol�,</p>
<p>Segue o link para visualizar/baixar seu boleto ${numeroFatura ? `da fatura <strong>${numeroFatura}</strong>` : ''}:</p>
<p><a href="${url}" target="_blank" rel="noreferrer">${url}</a></p>
<p>Ou visualize via proxy:</p>
<p><a href="${proxyLink}" target="_blank" rel="noreferrer">${proxyLink}</a></p>
<p>Atenciosamente,<br/>Unimed Patos de Minas</p>
`;
        await fastify.mailer.sendMail({ from: process.env.MAIL_FROM, to: email, subject, html });
        return { ok: true };
    });
};
