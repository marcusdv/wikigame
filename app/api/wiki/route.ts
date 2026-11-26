import { NextResponse, NextRequest } from "next/server";
import { USER_AGENT } from "@/app/lib/wikipedia";

// Tempo máximo (em segundos) que o Vercel aguarda essa função responder antes de cancelar.
export const maxDuration = 30;

// Rota GET chamada pelo frontend quando o jogador navega para uma página da Wikipedia.
// Recebe o nome da página como query param e devolve o JSON da Wikipedia com o HTML renderizado.
// Exemplo de chamada: GET /api/wiki?pagina=Imp%C3%A9rio%20Romano
//
// O QUE A RESPOSTA TRAZ (formato da API de parse da Wikipedia):
//   dados.parse.title     → título VERDADEIRO da página que abriu (ex.: pediu "EUA", vem "Estados Unidos")
//   dados.parse.text["*"] → HTML do artigo, que o frontend injeta no DOM
export async function GET(request: NextRequest) {
    // Busca o nome da página nos query params. Se não existir, usa "Brasil" como página inicial padrão.
    const pagina = request.nextUrl.searchParams.get("pagina") || "Brasil";

    try {
        // Corta "#seção" por segurança ("Chocolate#História" → "Chocolate"): a página é a mesma.
        const paginaLimpa = pagina.split("#")[0].trim();

        // Obrigatório para requests vindos de servidores em cloud (Vercel, AWS, etc.).
        // Sem ele, a Wikipedia bloqueia requisições de IPs de datacenter.
        const headers = { "User-Agent": USER_AGENT };

        // ==== UMA REQUISIÇÃO SÓ: API de parse com `redirects=1` ====
        //
        // ANTES eram duas: a API de sumário (para descobrir o título oficial de um apelido, ex.: "EUA")
        // e depois a de parse. A de parse sabe seguir redirecionamentos sozinha com `redirects=1`:
        // pede "EUA" e devolve o HTML de "Estados Unidos" com `parse.title = "Estados Unidos"`.
        // Resultado: metade das requisições por clique, e o título verdadeiro vem junto
        // (o jogo usa esse título para o histórico e para checar a vitória).
        //
        // encodeURIComponent (e não encodeURI): títulos com "/", "?", "&" ou "#" não quebram a URL.
        const url = `https://pt.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(paginaLimpa)}&redirects=1&format=json&prop=text`;

        const response = await fetch(url, { headers });

        if (!response.ok) {
            console.error("Problema com a resposta", response.status);
            return NextResponse.json({ message: "Erro ao buscar dados na Wikipedia" }, { status: response.status });
        }

        // Desempacota o JSON devolvido pela wikipedia.
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
