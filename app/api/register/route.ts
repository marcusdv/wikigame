import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/app/lib/supabase";

// 1. Receber { nome, email, senha } do formulário
// 2. Validar — campos vazios, email válido, etc
// 3. Verificar se o email ou nome já existe no banco
// 4. Gerar o hash da senha com bcrypt
// 5. Inserir o usuário no Supabase
// 6. Retornar sucesso ou erro

export async function POST(request: NextRequest) {
    try {
        // 1. pega os dados do body
        const { nome, email, senha } = await request.json();

        // 2. valida
        if (!nome || !email || !senha) {
            return NextResponse.json({ erro: "Preencha todos os campos" }, { status: 400 });
        }

        // 3. Gera o hash da senha
        const bcrypt = await import("bcrypt");
        const senha_hash = await bcrypt.hash(senha, 10);

        const { error } = await supabase.from("usuarios").insert({ nome, email, senha_hash });

        if (error) {
            // dados repetidos inválidos
            // código do postgres pra unique violation "23505"
            if (error.code === "23505") {
                if (error.message.includes("usuarios_email_key")) {
                    return NextResponse.json({ erro: "Email já cadastrado" }, { status: 409 });
                }
                if (error.message.includes("usuarios_nome_key")) {
                    return NextResponse.json({ erro: "Nome já cadastrado" }, { status: 409 });
                }
            }
        }
    } catch (error: unknown) {
        if (error instanceof Error) {
            console.error("Erro ao registrar usuário:", error.message);
            return NextResponse.json({ erro: "Erro ao registrar usuário" }, { status: 500 });
        }
    }
}
