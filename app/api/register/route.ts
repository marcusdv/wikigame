import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import bcrypt from "bcrypt";
import * as z from "zod";

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
    try {
        // 1. pega os dados do body
        const { nome, email, senha } = await request.json();

        // 2. valida (com zod)
        const validacaoZod = dadosUsuarioSchema.safeParse({ nome, email, senha });
        if (!validacaoZod.success) {
            return NextResponse.json({ error: validacaoZod.error.issues[0].message }, { status: 400 });
        }

        // 3. Gera o hash da senha
        const senha_hash = await bcrypt.hash(senha, 10);

        const { data, error } = await supabaseAdmin
            .from("usuarios")
            .insert({ nome, email, senha_hash })
            .select()
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

        return NextResponse.json({ message: "Usuário criado com sucesso!" }, { status: 201 });
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Erro ao registrar usuário:", error.message);
            return NextResponse.json({ error: "Erro ao registrar usuário" }, { status: 500 });
        }
    }
}
