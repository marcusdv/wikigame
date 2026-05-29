// Verifica se cada página do array existe na Wikipedia PT com o título exato.
// Um título diferente significa que o jogo pode não detectar a vitória corretamente.

// Uso: npx tsx scripts/verificar-paginas.ts
// OU
// npm run verificar

// Dica: se a Wikipedia devolve um título diferente, copie o título correto do terminal
// e cole no array de páginas.

import { paginas as paginasUtilizadas } from "../data/paginasObjetivo";
import { paginasNovas } from "./novosDados";
const DELAY_MS = 600;
const USER_AGENT = "WikiRun/1.0 (verificacao de titulos; marcus.vinicius.bittencourt.c@gmail.com)";

// Pausa a execução por `ms` milissegundos para não sobrecarregar a API da Wikipedia.
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Consulta a API de sumário da Wikipedia para um título e compara com o título esperado.
// Retorna se bateram, o título que a Wikipedia devolveu, e o erro caso a requisição falhe.
async function verificar(titulo: string) {
    const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURI(titulo)}`;
    try {
        const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
        if (!res.ok) return { titulo, tituloWiki: null, ok: false, erro: `HTTP ${res.status}` };

        const dados = await res.json();
        const tituloWiki: string = dados.title ?? "";
        const ok = tituloWiki.toLowerCase().trim() === titulo.toLowerCase().trim();
        return { titulo, tituloWiki, ok };
    } catch (err) {
        return { titulo, tituloWiki: null, ok: false, erro: String(err) };
    }
}

const paginas = paginasNovas;

// Itera sobre todas as páginas do array, verifica cada uma e imprime o resultado no terminal.
async function main() {
    console.log(`Verificando ${paginas.length} páginas (${DELAY_MS}ms entre cada)...\n`);

    const problemas: Array<{ titulo: string; tituloWiki: string | null; ok: boolean; erro?: string }> = [];

    for (let i = 0; i < paginas.length; i++) {
        const resultado = await verificar(paginas[i]);

        if (resultado.ok) {
            console.log(`  ✓  ${resultado.titulo} → "${resultado.tituloWiki}"`);
        } else if (resultado.erro) {
            console.log(`  ✗  "${resultado.titulo}" → ${resultado.erro}`);
            problemas.push(resultado);
        } else {
            console.log(`  ≠  "${resultado.titulo}" → Wikipedia: "${resultado.tituloWiki}"`);
            problemas.push(resultado);
        }

        if (i < paginas.length - 1) await sleep(DELAY_MS);
    }

    console.log(`\n${"─".repeat(55)}`);
    console.log(
        `Total: ${paginas.length}  |  OK: ${paginas.length - problemas.length}  |  Problema: ${problemas.length}`,
    );

    if (problemas.length > 0) {
        console.log(`\nPáginas que precisam de atenção:`);
        for (const p of problemas) {
            if (p.erro) {
                console.log(`  "${p.titulo}" → ${p.erro}`);
            } else {
                console.log(`  "${p.titulo}"  →  use "${p.tituloWiki}" no array`);
            }
        }
    } else {
        console.log(`\nTodas as páginas batem com a Wikipedia.`);
    }
}

main().catch(console.error);
