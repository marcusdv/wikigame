import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import bcrypt from "bcrypt";
import * as z from "zod";
import { SignJWT } from "jose";

const chave = new TextEncoder().encode(process.env.JWT_SECRET);

// 1. Receber { nome, email, senha } do formulário
// 2. Validar — campos vazios, email válido, etc
// 3. Verificar se o email ou nome já existe no banco
// 4. Gerar o hash da senha com bcrypt
// 5. Inserir o usuário no Supabase
// 6. Retornar sucesso ou erro

const dadosUsuarioSchema = z.object({
    nome: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres"),
    email: z.email("Email inválido"),
    senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

export async function POST(request: NextRequest) {
    // verifica se chave é válida
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        return NextResponse.json({ error: "Configuração inválida" }, { status: 500 });
    }

    try {
        // 1. pega os dados do body
        const { nome, email, senha } = await request.json();

        // 2. valida (com zod)
        const validacaoZod = dadosUsuarioSchema.safeParse({ nome, email, senha });
        if (!validacaoZod.success) {
            return NextResponse.json({ error: validacaoZod.error.issues[0].message }, { status: 400 });
        }

        // 3. Gera o hash da senha
        console.log("[register] gerando hash...");
        const senha_hash = await bcrypt.hash(senha, 10);

        console.log("[register] inserindo no banco...");
        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .insert({ nome, email, senha_hash })
            .select("id, nome, email")
            .single();

        if (error) {
            // dados repetidos inválidos
            // código do postgres pra unique violation "23505"
            if (error.code === "23505") {
                if (error.message.includes("usuarios_email_key")) {
                    return NextResponse.json({ error: "Email já cadastrado" }, { status: 409 });
                }
                if (error.message.includes("usuarios_nome_key")) {
                    return NextResponse.json({ error: "Nome já cadastrado" }, { status: 409 });
                }
            }

            console.error("Erro ao inserir usuário:", error);
            return NextResponse.json({ error: "Erro ao registrar usuário" }, { status: 500 });
        }

        if (data === null) {
            console.error("Erro ao inserir usuário:", error);
            console.log("DATA do banco:", data);
            return NextResponse.json({ error: "Erro ao registrar usuário" }, { status: 500 });
        }

        // 4. Gerar o token JWT
        console.log("[register] gerando JWT... chave length:", chave.length);
        const token = await new SignJWT({ id: data.id, email: data.email, nome: data.nome })
            .setProtectedHeader({ alg: "HS256" })
            .setExpirationTime("7d")
            .sign(chave);

        console.log("[register] JWT gerado, retornando resposta...");
        const resposta = NextResponse.json({ message: "Usuário criado com sucesso" }, { status: 200 });

        // 5. Setar o cookie com o token JWT
        resposta.cookies.set("token", token, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7,
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
        });

        return resposta;
    } catch (error: unknown) {
        console.error("Erro ao registrar usuário:", error);
        return NextResponse.json({ error: "Erro ao registrar usuário" }, { status: 500 });
    }
}
