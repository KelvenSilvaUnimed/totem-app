import fp from 'fastify-plugin';
const loggingPlugin = async (app) => {
    app.addHook('preHandler', async (request) => {
        if (request.body) {
            app.log.info({ body: request.body }, `[BACKEND DATA CAPTURE] Request Body [${request.method} ${request.url}]`);
        }
    });
    app.addHook('onSend', async (request, reply, payload) => {
        let parsedPayload;
        try {
            parsedPayload = JSON.parse(payload);
        }
        catch {
            parsedPayload = '[Non-JSON Payload]';
        }
        app.log.info({
            url: request.url,
            method: request.method,
            status: reply.statusCode,
            response: parsedPayload
        }, `[BACKEND DATA CAPTURE] Response [${request.method} ${request.url}]`);
        return payload;
    });
};
export default fp(loggingPlugin);
