import { NextRequest, NextResponse } from "next/server";
import { buscarNomesDaPagina } from "@/app/lib/wikipedia";

// ==== ROTA QUE DEVOLVE O TÍTULO OFICIAL E OS APELIDOS DE UMA PÁGINA ====
//
// Chamada UMA vez no início de cada partida (pelo useGameLogic), com a página objetivo.
// Com a lista de nomes, o jogo reconhece a vitória mesmo quando o objetivo é um apelido:
// objetivo "Avalanche" → o jogador chega em "Avalancha" (título oficial) → "Avalancha" está na lista → venceu.
//
// Exemplo:
//   GET /api/nomes-da-pagina?pagina=Avalanche
//   → { "titulo": "Avalancha", "nomes": ["Avalanche", "Avalancha", "Alude", "Corredor de avalanche", "Para-avalanche"] }

export async function GET(request: NextRequest) {
    const pagina = request.nextUrl.searchParams.get("pagina")?.trim();

    // Validação simples antes de chamar a Wikipedia.
    if (!pagina || pagina.length > 300) {
        return NextResponse.json({ error: "Parâmetro 'pagina' inválido" }, { status: 400 });
    }

    try {
        const resultado = await buscarNomesDaPagina(pagina);
        if (!resultado) {
            return NextResponse.json({ error: "Página não encontrada na Wikipedia" }, { status: 404 });
        }
        return NextResponse.json(resultado);
    } catch (err) {
        console.error("[nomes-da-pagina] erro:", err instanceof Error ? err.message : err);
        return NextResponse.json({ error: "Erro ao consultar a Wikipedia" }, { status: 502 });
    }
}
