import { NextResponse } from "next/server";

export async function POST() {
    const resposta = NextResponse.json({ message: "Logout realizado" }, { status: 200 });

    resposta.cookies.set("token", "", {
        httpOnly: true,
        maxAge: 0,
        path: "/",
    });

    return resposta;
}
