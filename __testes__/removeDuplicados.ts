// Recebe dois arrays e retorna apenas os elementos únicos entre eles (sem duplicatas).
// Salva o resultado em txts/so-unicas.txt para inspeção manual.
// Uso: npx tsx __testes__/seHaPalavrasIguaisNasArr.ts

import { fileURLToPath } from "url";
import { arrPaginasIniciais } from "../app/data/paginasIniciais";
import { arrPaginasObjetivo } from "../app/data/paginasObjetivo";
import { novasPaginas } from "./dados/novasIniciais";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const arraysParaLimpar = {
    arr1: novasPaginas,
    arr2: arrPaginasIniciais,
};

const set = new Set(arraysParaLimpar.arr1.concat(arraysParaLimpar.arr2));

// import.meta.url aponta para este arquivo — garante que txts/ seja criado
// sempre dentro de __testes__/, independente de onde o comando foi rodado.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pasta = path.join(__dirname, "txts");
const destino = path.join(pasta, "so-unicas.txt");
mkdirSync(pasta, { recursive: true });
writeFileSync(destino, JSON.stringify([...set], null, 2), "utf-8");
