import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import * as z from "zod";
import { SignJWT } from "jose";

// chave secreta no env local, convertida pra Uint8Array
const chave = new TextEncoder().encode(process.env.JWT_SECRET);

// esquema de validação dos dados de login ZOD
const loginSchema = z.object({
    email: z.email("Email inválido"),
    senha: z.string(),
});

export async function POST(request: NextRequest) {
    try {
        // 1. pega os dados do body
        const { email, senha } = await request.json();

        // 2. valida com ZOD
        const validacaoZod = loginSchema.safeParse({ email, senha });

        if (!validacaoZod.success) {
            return NextResponse.json({ error: validacaoZod.error.issues[0].message }, { status: 400 });
        }

        // 3. Busca o usuário no Supabase
        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .select("id, nome, email, senha_hash")
            .eq("email", email)
            .single();

        if (error) {
            return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
        }

        const senhaCorreta = await bcrypt.compare(senha, data.senha_hash);

        if (!senhaCorreta) {
            return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
        }

        // 4. Gerar JWT

        // ! pensar mais a respeito do jwt.
        const token = await new SignJWT({ id: data.id, email: data.email, nome: data.nome })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("7d")
            .sign(chave);

        const resposta = NextResponse.json({ message: "Login bem-sucedido" }, { status: 200 });

        // 5. Setar o cookie com o token JWT
        resposta.cookies.set("token", token, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        // 6. Retornar sucesso
        return resposta;
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Erro ao fazer login:", error.message);
            return NextResponse.json({ error: "Erro ao fazer login" }, { status: 500 });
        }

        return NextResponse.json({ error: "Erro desconhecido ao fazer login" }, { status: 500 });
    }
}
