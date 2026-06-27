import { NextResponse } from "next/server";

// Rota de logout
export async function POST() {
    const resposta = NextResponse.json({ message: "Logout realizado" }, { status: 200 });

    // Limpar o cookie do token JWT
    resposta.cookies.set("token", "", {
        httpOnly: true,
        maxAge: 0,
        path: "/",
    });

    return resposta;
}
