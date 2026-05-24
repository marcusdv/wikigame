import { NextResponse } from "next/server";

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
        const urlSumario = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURI(paginaLimpa)}`;
        const respostaSumario = await fetch(urlSumario);

        console.log("SUMARIO URL:", urlSumario);

        // Começa com o valor que temos; só substitui se o sumário responder com sucesso.
        let tituloOficial = paginaLimpa;

        if (respostaSumario.ok) {
            const dadosSumario = await respostaSumario.json();
            // A Wikipedia devolve o título com espaços. Trocamos por underlines
            // porque a API de parse (passo 2) espera esse formato.
            // Ex: "Estados Unidos" → "Estados_Unidos"
            tituloOficial = dadosSumario.title.replace(/\s+/g, "_");
        }

        // PASSO 2 — Buscar o HTML completo da página via API de Parse
        //
        // Agora que temos o título canônico, pedimos o conteúdo renderizado em HTML.
        // O encodeURI garante que acentos (ex: "á" → "%C3%A1") sejam enviados corretamente.
        //
        // Ex:  tituloOficial = "Estados_Unidos"
        //   → GET https://pt.wikipedia.org/w/api.php?action=parse&page=Estados_Unidos&...
        //   → dados.parse.text["*"]  contém o HTML da página, que o frontend renderiza
        const url = `https://pt.wikipedia.org/w/api.php?action=parse&page=${encodeURI(tituloOficial)}&format=json&prop=text`;

        const response = await fetch(url);
        const dados = await response.json();

        // Devolve o JSON completo da Wikipedia para o frontend extrair o HTML.
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
