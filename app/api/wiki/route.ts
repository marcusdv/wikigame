import { NextResponse } from "next/server";

export const maxDuration = 30;

// Rota GET chamada pelo frontend quando o jogador clica em um link da Wikipedia.
// Recebe o nome da página como query param e devolve o HTML completo para renderizar.
// Exemplo de chamada: GET /api/wiki?pagina=Imp%C3%A9rio%20Romano
export async function GET(request: Request) {
    // Extrai o valor do query param "pagina" da URL.
    // Ex: "/api/wiki?pagina=Forma de Governo"  →  pagina = "Forma de Governo"
    // Se nada for passado, usa "Brasil" como fallback.
    const { searchParams } = new URL(request.url);
    const pagina = searchParams.get("pagina") || "Brasil";

    try {
        const paginaLimpa = pagina.trim();

        // PASSO 1 — Resolver redirecionamentos via API de Sumário
        //
        // Problema: a API de parse da Wikipedia é sensível ao título exato.
        // Se o jogador clicou em "/wiki/EUA", a Wikipedia internamente redireciona
        // para "Estados Unidos", e a API de parse falha se passarmos "EUA".
        //
        // Solução: chamamos primeiro a API de sumário, que segue o redirecionamento
        // e nos devolve o título canônico.
        //
        // Ex:  pagina = "EUA"
        //   → GET https://pt.wikipedia.org/api/rest_v1/page/summary/EUA
        //   → dadosSumario.title = "Estados Unidos"
        //   → tituloOficial = "Estados_Unidos"  (underlines para o passo 2)
        // User-Agent obrigatório para requests de servidores em cloud (Vercel, AWS, etc.).
        // Sem ele, a Wikipedia bloqueia ou limita requests vindos de IPs de datacenter.
        const headers = {
            "User-Agent": "WikiRun/1.0 (https://github.com/wikirun; marcus.vinicius.bittencourt.c@gmail.com)",
        };

        const urlSumario = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURI(paginaLimpa)}`;
        const respostaSumario = await fetch(urlSumario, { headers });

        let tituloOficial = paginaLimpa;

        if (respostaSumario.ok) {
            const dadosSumario = await respostaSumario.json();
            tituloOficial = dadosSumario.title.replace(/\s+/g, "_");
        }

        const url = `https://pt.wikipedia.org/w/api.php?action=parse&page=${encodeURI(tituloOficial)}&format=json&prop=text`;

        const response = await fetch(url, { headers });
        const dados = await response.json();

        if (!dados.parse) {
            throw new Error(dados.error?.info ?? "Página não encontrada na Wikipedia");
        }

        return NextResponse.json(dados);
    } catch (err) {
        // Se qualquer fetch falhar (rede, JSON inválido, etc.), devolve uma mensagem
        // de erro estruturada em vez de deixar a rota explodir com 500.
        return NextResponse.json({
            message: "Erro no GET da API da wikipedia",
            error: err instanceof Error ? err.message : "Erro desconhecido",
        });
    }
}
