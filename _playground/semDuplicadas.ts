// Une dois arrays, remove duplicatas e salva o resultado em txts/semDuplicadasNaArr.txt.
// Uso: npx tsx __testes__/semDuplicadas.ts

import { fileURLToPath } from "url";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { arrPaginasIniciais } from "../app/dados/paginasIniciais";
import { arrPaginasObjetivo } from "../app/dados/paginasObjetivo";
import { arrNovosObjetivos } from "./novos-dados/novosObjetivo";
import { novasPaginasIniciais } from "./novos-dados/novasIniciais";
// ==== COLOQUE OS ARRAYS AQUI ====
const arr1: string[] = arrPaginasIniciais;
const arr2: string[] = novasPaginasIniciais;
// ================================

const resultado = [...new Set([...arr1, ...arr2])];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pasta = path.join(__dirname, "txts");
mkdirSync(pasta, { recursive: true });
const linhas = resultado.map((item) => `  "${item}",`).join("\n");
const conteudo = `export const arrPaginasIniciais = [\n${linhas}\n];\n`;
writeFileSync(path.join(pasta, "semDuplicadasNaArr.txt"), conteudo, "utf-8");

console.log(`${resultado.length} itens salvos em txts/semDuplicadasNaArr.txt`);
