// Para cada página do array, busca o resumo na Wikipedia e salva em txts/conteudo-na-wiki.txt.
// Útil para confirmar que a página retornada é o artigo certo e não uma desambiguação.
// Uso: npx tsx __testes__/checaConteudoNaWiki.ts

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { novasPaginasIniciais } from "./dados/novasIniciais";
import { arrNovosObjetivos } from "./dados/novosObjetivo";

const DELAY_MS = 700;
const LIMITE_PALAVRAS = 300;
// User-Agent obrigatório — sem ele a Wikipedia pode bloquear as requisições.
const USER_AGENT = "WikiRun/1.0 (inspecao de conteudo; marcus.vinicius.bittencourt.c@gmail.com)";

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

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

function primeirasNPalavras(texto: string, n: number): string {
    const palavras = texto.trim().split(/\s+/);
    const cortado = palavras.slice(0, n).join(" ");
    return palavras.length > n ? cortado + "..." : cortado;
}

const paginas = novasPaginasIniciais;

async function main() {
    // Acumula tudo na memória e escreve de uma vez — evita I/O a cada iteração.
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

    // import.meta.url aponta para este arquivo — garante que txts/ seja criado
    // sempre dentro de __testes__/, independente de onde o comando foi rodado.
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const pasta = path.join(__dirname, "txts");
    const destino = path.join(pasta, "conteudo-na-wiki.txt");
    fs.mkdirSync(pasta, { recursive: true });
    fs.writeFileSync(destino, saida, "utf-8");

    console.log(`\nArquivo gerado: ${destino}`);
}

main().catch(console.error);
