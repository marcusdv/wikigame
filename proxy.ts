import { jwtVerify } from "jose";
import { NextRequest, NextResponse } from "next/server";

const chave = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(request: NextRequest) {
    const token = request.cookies.get("token")?.value;
    const { pathname } = request.nextUrl;

    // rotas que exigem login
    if (pathname.startsWith("/jogar") || pathname.startsWith("/perfil")) {
        if (!token) return NextResponse.redirect(new URL("/login", request.url));
        try {
            await jwtVerify(token, chave);
            return NextResponse.next();
        } catch {
            return NextResponse.redirect(new URL("/login", request.url));
        }
    }

    // rotas que usuário logado não deveria ver
    if (pathname.startsWith("/login") || pathname.startsWith("/registro")) {
        if (token) {
            try {
                await jwtVerify(token, chave);
                return NextResponse.redirect(new URL("/diario", request.url));
            } catch {
                return NextResponse.next();
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/jogar/:path*", "/perfil/:path*", "/login", "/registro"],
};
