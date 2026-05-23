import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pagina = searchParams.get("pagina") || "Brasil";

    try {
        // =========================================================================
        // DECODIFICAÇÃO INICIAL: Limpa o "?pagina=" recebido do fetch do frontend.
        // Se veio "Istmo_do_Panam%25C3%25A1", o decode transforma em "Istmo_do_Panamá"
        // =========================================================================
        const paginaDecodificada = decodeURIComponent(pagina.trim());

        // =========================================================================
        // PASSO 1: O "Tradutor" de Redirecionamentos (API de Sumário)
        // Usamos encodeURI para garantir que o "á" de "Panamá" vá como "%C3%A1"
        // =========================================================================
        const urlSumario = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURI(paginaDecodificada)}`;
        const respostaSumario = await fetch(urlSumario);

        console.log("SUMARIO URL:", urlSumario);

        let tituloOficial = paginaDecodificada;

        if (respostaSumario.ok) {
            const dadosSumario = await respostaSumario.json();
            // A Wikipédia devolve o título sem codificação e com espaços normais.
            // Ajustamos para usar underlines antes do passo 2.
            tituloOficial = dadosSumario.title.replace(/\s+/g, "_");
        }

        // =========================================================================
        // PASSO 2: A Busca do Conteúdo Real (Sua API de Parse)
        // O encodeURI protege contra acentos que a Wikipédia devolveu no Passo 1
        // =========================================================================
        const url = `https://pt.wikipedia.org/w/api.php?action=parse&page=${encodeURI(tituloOficial)}&format=json&prop=text`;

        const response = await fetch(url);
        const dados = await response.json();

        return NextResponse.json(dados);
    } catch (err) {
        return NextResponse.json({
            message: "Erro no GET da API da wikipedia",
            error: err instanceof Error ? err.message : "Erro desconhecido",
        });
    }
}
