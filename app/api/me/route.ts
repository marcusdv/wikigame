import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const chave = new TextEncoder().encode(process.env.JWT_SECRET);

// Retorna informações do usuário autenticado com base no token JWT presente nos cookies da requisição.
// autenticação quer dizer que o usuário está logado e tem permissão para acessar recursos protegidos.
// Se o token não estiver presente ou for inválido, retorna um erro 401 (não autorizado).
// Se o token for válido, retorna os dados do usuário (id, email e nome) em formato JSON com status 200 (OK).
export async function GET(request: NextRequest) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Token não encontrado" }, { status: 401 });
    }

    try {
        const { payload } = await jwtVerify(token, chave);
        // id, email e nome são extraídos do payload do token JWT e retornados como resposta JSON.
        return NextResponse.json({ id: payload.id, email: payload.email, nome: payload.nome }, { status: 200 });
    } catch {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
}
