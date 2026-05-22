import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pagina = searchParams.get("pagina") || "Brasil";
    try {
        const request = `https://pt.wikipedia.org/w/api.php?action=parse&page=${pagina}&format=json&prop=text`;
        const response = await fetch(request);
        const dados = await response.json();

        return NextResponse.json(dados);
    } catch (err) {
        return NextResponse.json({
            message: "Erro no GET da API da wikipedia",
            error: err instanceof Error ? err.message : "Erro desconhecido",
        });
    }
}
// ADICIONE ESTA LINHA AQUI:
