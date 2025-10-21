import { Project, SyntaxKind } from "ts-morph";
import path from "node:path";

const project = new Project({
  tsConfigFilePath: path.resolve("tsconfig.json"),
});

project.addSourceFilesAtPaths(["src/**/*.ts", "src/**/*.tsx"]);

const isRelative = (s: string) => s.startsWith("./") || s.startsWith("../");
const hasExt = (s: string) => /\.[a-z0-9]+$/i.test(s);
const isKnownExt = (s: string) => /\.(m?js|json|node|css|svg|png|jpg|jpeg|gif|webp)$/i.test(s);

let changed = 0;

for (const f of project.getSourceFiles()) {
  const imports = f.getImportDeclarations();
  for (const imp of imports) {
    const spec = imp.getModuleSpecifierValue();
    if (!isRelative(spec)) continue;
    if (hasExt(spec)) continue;           // já tem extensão
    // acrescenta .js, pois no dist o arquivo será .js
    imp.setModuleSpecifier(spec + ".js");
    changed++;
  }
}

if (changed > 0) {
  project.saveSync();
  console.log(`Atualizados ${changed} imports.`);
} else {
  console.log("Nenhuma mudança necessária.");
}
