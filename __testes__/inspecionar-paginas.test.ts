// Para cada página do array, busca o texto de abertura na Wikipedia e exibe
// as primeiras 300 palavras no terminal — útil para confirmar que o conteúdo
// retornado é o artigo esperado e não uma desambiguação ou página errada.
//
// Uso: npm run inspecionar

import { arrNovas } from "./novas";
import fs from "fs";
import path from "path";

const DELAY_MS = 700;
const LIMITE_PALAVRAS = 300;
const USER_AGENT = "WikiRun/1.0 (inspecao de conteudo; marcus.vinicius.bittencourt.c@gmail.com)";
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Busca o resumo em texto puro da página. A API de sumário devolve o campo `extract`
// com o texto de abertura do artigo, sem tags HTML — ideal para leitura no terminal.
async function buscarResumo(titulo: string): Promise<string | null> {
    const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURI(titulo)}`;
    try {
        const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
        if (!res.ok) return null;
        const dados = await res.json();
        return dados.extract ?? null;
    } catch {
        return null;
    }
}

// Corta o texto nas primeiras `n` palavras, mantendo a leitura natural.
function primeirasNPalavras(texto: string, n: number): string {
    const palavras = texto.trim().split(/\s+/);
    const cortado = palavras.slice(0, n).join(" ");
    return palavras.length > n ? cortado + "..." : cortado;
}

const paginas = arrNovas;

// Itera sobre o array, busca o resumo de cada página e imprime no console.
async function main() {
    let saida = "";

    saida += `Inspecionando ${paginas.length} páginas (${DELAY_MS}ms entre cada)...\n\n`;
    saida += "=".repeat(60) + "\n";

    for (let i = 0; i < paginas.length; i++) {
        const titulo = paginas[i];
        const resumo = await buscarResumo(titulo);

        saida += `\n[${i + 1}/${paginas.length}] ${titulo}\n`;
        saida += "─".repeat(60) + "\n";

        if (resumo) {
            saida += primeirasNPalavras(resumo, LIMITE_PALAVRAS) + "\n";
        } else {
            saida += "  ✗  Falha ao buscar conteúdo.\n";
        }

        console.log(`[${i + 1}/${paginas.length}] ${titulo}`);

        if (i < paginas.length - 1) await sleep(DELAY_MS);
    }

    saida += "\n" + "=".repeat(60) + "\n";
    saida += `Concluído. ${paginas.length} páginas inspecionadas.\n`;

    const destino = path.join(__dirname, "resultado.txt");
    fs.writeFileSync(destino, saida, "utf-8");
    console.log(`\nArquivo gerado: ${destino}`);
}

main().catch(console.error);
