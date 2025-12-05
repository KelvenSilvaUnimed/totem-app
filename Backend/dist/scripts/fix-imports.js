"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts_morph_1 = require("ts-morph");
const node_path_1 = __importDefault(require("node:path"));
const project = new ts_morph_1.Project({
    tsConfigFilePath: node_path_1.default.resolve("tsconfig.json"),
});
project.addSourceFilesAtPaths(["src/**/*.ts", "src/**/*.tsx"]);
const isRelative = (s) => s.startsWith("./") || s.startsWith("../");
const hasExt = (s) => /\.[a-z0-9]+$/i.test(s);
const isKnownExt = (s) => /\.(m?js|json|node|css|svg|png|jpg|jpeg|gif|webp)$/i.test(s);
let changed = 0;
for (const f of project.getSourceFiles()) {
    const imports = f.getImportDeclarations();
    for (const imp of imports) {
        const spec = imp.getModuleSpecifierValue();
        if (!isRelative(spec))
            continue;
        if (hasExt(spec))
            continue;
        imp.setModuleSpecifier(spec + ".js");
        changed++;
    }
}
if (changed > 0) {
    project.saveSync();
    console.log(`Atualizados ${changed} imports.`);
}
else {
    console.log("Nenhuma mudança necessária.");
}
