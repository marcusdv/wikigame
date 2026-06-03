import { NextResponse, NextRequest } from "next/server";

// Tempo máximo (em segundos) que o Vercel aguarda essa função responder antes de cancelar.
export const maxDuration = 30;

// Rota GET chamada pelo frontend quando o jogador navega para uma página da Wikipedia.
// Recebe o nome da página como query param e devolve o JSON da Wikipedia com o HTML renderizado.
// Exemplo de chamada: GET /api/wiki?pagina=Imp%C3%A9rio%20Romano
export async function GET(request: NextRequest) {
    // Busca o nome da página nos query params. Se não existir, usa "Brasil" como página inicial padrão.
    const pagina = request.nextUrl.searchParams.get("pagina") || "Brasil";

    try {
        const paginaLimpa = pagina.trim();

        // Obrigatório para requests vindos de servidores em cloud (Vercel, AWS, etc.).
        // Sem ele, a Wikipedia bloqueia requisições de IPs de datacenter.
        const headers = {
            "User-Agent": "WikiRun/1.0 (https://github.com/wikirun; marcus.vinicius.bittencourt.c@gmail.com)",
        };

        // PASSO 1 — Resolver o título ORIGINAL via API de Sumário
        //
        // A API de parse é sensível ao título exato. Se o jogador clicou em "EUA",
        // A wikipedia tem redirecionamentos automáticos para lidar com sinônimos, grafias alternativas, capitalização, etc.
        // A Wikipedia redireciona para "Estados Unidos" — e a API de parse falha com "EUA".
        // A API de sumário segue o redirecionamento e devolve o título correto.
        //
        // Ex: "EUA" → summary → title: "Estados Unidos" → tituloOficial: "Estados_Unidos"
        const urlSumario = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURI(paginaLimpa)}`;
        const respostaSumario = await fetch(urlSumario, { headers });

        // Se o sumário falhar, continua com o valor original como fallback.
        let tituloOficial = paginaLimpa;

        // Se a resposta do sumário for bem-sucedida, extrai o título oficial da página, que é o formato esperado pela API de parse.
        // ex: "Estados Unidos" → "Estados_Unidos"
        // A API de parse é sensível a underlines vs espaços, então substituímos espaços por underlines no título oficial.
        if (respostaSumario.ok) {
            const dadosSumario = await respostaSumario.json();
            // A API de parse espera underlines em vez de espaços no título.
            tituloOficial = dadosSumario.title.replace(/\s+/g, "_");
        }

        // PASSO 2 — Buscar o HTML completo via API de Parse
        //
        // A WIKIPEDIA tem uma API para devolver o HTML renderizado de uma página.
        // Retorna o HTML renderizado da página dentro de dados.parse.text["*"],
        // que o frontend injeta no DOM via dangerouslySetInnerHTML.

        const url = `https://pt.wikipedia.org/w/api.php?action=parse&page=${encodeURI(tituloOficial)}&format=json&prop=text`;

        // e faz a requisição
        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.error("Problema com a resposta", response.status, response);
            return;
        }

        // captura os dados da resposta asíncrona e desempacota o JSON devolvido pela wikipedia.
        const dados = await response.json();

        // Se dados.parse não existir, a Wikipedia retornou um erro (ex: página inexistente).
        if (!dados.parse) {
            return NextResponse.json(
                { message: dados.error?.info ?? "Página a ser parseada não encontrada" },
                { status: 404 }, // ← cliente pediu algo que não existe
            );
        }

        return NextResponse.json(dados);
    } catch (err) {
        // erro ao buscar na Wikipedia — erro do servidor (teu servidor falhou)
        return NextResponse.json(
            {
                message: "Erro ao buscar página na Wikipedia",
                error: err instanceof Error ? err.message : "Erro desconhecido",
            },
            { status: 500 }, // ← teu servidor teve um problema interno
        );
    }
}
