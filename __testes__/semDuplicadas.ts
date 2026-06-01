// Une dois arrays, remove duplicatas e salva o resultado em txts/semDuplicadasNaArr.txt.
// Uso: npx tsx __testes__/semDuplicadas.ts

import { fileURLToPath } from "url";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";
import { arrPaginasIniciais } from "../app/data/paginasIniciais";
import { arrPaginasObjetivo } from "../app/data/paginasObjetivo";
import { novasPaginas } from "./dados/novasIniciais";
// ==== COLOQUE OS ARRAYS AQUI ====
const arr1: string[] = arrPaginasIniciais;
const arr2: string[] = novasPaginas;
// ================================

const resultado = [...new Set([...arr1, ...arr2])];

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pasta = path.join(__dirname, "txts");
mkdirSync(pasta, { recursive: true });
writeFileSync(path.join(pasta, "semDuplicadasNaArr.txt"), JSON.stringify(resultado, null, 2), "utf-8");

console.log(`${resultado.length} itens salvos em txts/semDuplicadasNaArr.txt`);
