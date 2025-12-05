"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsPlugin = void 0;
const cors_1 = __importDefault(require("@fastify/cors"));
const corsPlugin = async (fastify) => {
    await fastify.register(cors_1.default, {
        origin: true,
        credentials: false,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
        exposedHeaders: ['Content-Type', 'Content-Disposition'],
    });
    fastify.addHook('onSend', async (request, reply, payload) => {
        reply.header('Access-Control-Allow-Origin', '*');
        reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
        return payload;
    });
};
exports.corsPlugin = corsPlugin;
