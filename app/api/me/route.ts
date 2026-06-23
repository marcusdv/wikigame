import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const chave = new TextEncoder().encode(process.env.JWT_SECRET);

export async function GET(request: NextRequest) {
    const token = request.cookies.get("token")?.value;

    if (!token) {
        return NextResponse.json({ error: "Token não encontrado" }, { status: 401 });
    }

    try {
        const { payload } = await jwtVerify(token, chave);
        return NextResponse.json({ id: payload.id, email: payload.email, nome: payload.nome }, { status: 200 });
    } catch {
        return NextResponse.json({ error: "Token inválido" }, { status: 401 });
    }
}
