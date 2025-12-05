"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.securityPlugin = void 0;
const helmet_1 = __importDefault(require("@fastify/helmet"));
const securityPlugin = async (fastify) => {
    // Helmet geral (sem CSP global, pois /api/pdf ajusta CSP por rota)
    await fastify.register(helmet_1.default, {
        contentSecurityPolicy: false,
    });
};
exports.securityPlugin = securityPlugin;
