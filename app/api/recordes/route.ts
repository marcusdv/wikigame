import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import * as z from "zod";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";

// ==== ROTA QUE SALVA O RECORDE DO DESAFIO DIÁRIO ====
//
// POR QUE ESTA ROTA EXISTE
// Antes, o próprio navegador gravava o recorde no Supabase com a chave pública (anon),
// dizendo "sou o usuário X e fiz Y pontos". Como o login do WikiRun é próprio (JWT no cookie)
// e não o Supabase Auth, o banco não tinha como saber quem estava logado: qualquer pessoa,
// pelo console do navegador, conseguia gravar qualquer pontuação no nome de qualquer usuário.
//
// COMO FICA AGORA
// O navegador só manda o que aconteceu na partida ({ historico, pontos, data }).
// Quem decide QUEM é o usuário e SE a partida é válida é o servidor:
//   1. o usuário vem do cookie JWT (assinado pelo servidor, o navegador não consegue forjar);
//   2. a partida é conferida com a palavra do dia que está no banco;
//   3. a gravação usa o supabaseAdmin (service role), que só existe no servidor.
// Depois disso, a política de INSERT do anon na tabela `recordes` pode ser removida.
//
// Exemplo de chamada (feita pela VoceVenceuTela):
//   POST /api/recordes
//   { "historico": ["Laika", "Cão", "Chocolate"], "pontos": 2, "data": "2026-11-25" }

// Mesma chave usada no login/registro para assinar o JWT.
const chave = new TextEncoder().encode(process.env.JWT_SECRET);

// Limites "de bom senso": impedem corpos gigantes e valores absurdos antes de qualquer consulta ao banco.
const MAX_PAGINAS_NO_HISTORICO = 1000;
const MAX_PONTOS = 10000;

// Formato esperado do corpo da requisição, validado com Zod.
const recordeSchema = z.object({
    // Páginas visitadas, da inicial até o objetivo. Precisa de pelo menos 2 (começou e chegou).
    historico: z.array(z.string().trim().min(1).max(300)).min(2).max(MAX_PAGINAS_NO_HISTORICO),
    // Pontos que o jogo calculou (cliques + custo de voltar). Inteiro positivo.
    pontos: z.number().int().min(1).max(MAX_PONTOS),
    // Data do desafio no formato "2026-11-25" (é a "seed" do desafio diário).
    data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida"),
});

// ==== DATA NO FUSO DE BRASÍLIA (UTC-3), FORMATO "YYYY-MM-DD" ====
// Mesma conta usada no DesafioDiario: tira 3h do horário UTC e lê a data.
// `diasAtras` permite pegar a data de ontem (1).
function dataEmBrasilia(diasAtras = 0): string {
    const d = new Date(Date.now() - 3 * 60 * 60 * 1000 - diasAtras * 24 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

// Compara títulos de página sem diferenciar maiúsculas e espaços nas pontas
// (a mesma regra que o gameReducer usa para decidir a vitória).
function mesmaPagina(a: string, b: string): boolean {
    return a.toLocaleLowerCase().trim() === b.toLocaleLowerCase().trim();
}

export async function POST(request: NextRequest) {
    // ==== 1. QUEM É O USUÁRIO? (pelo cookie, nunca pelo corpo) ====
    const token = request.cookies.get("token")?.value;
    if (!token) {
        return NextResponse.json({ error: "Faça login para salvar o recorde" }, { status: 401 });
    }

    let idUsuario: string;
    try {
        // jwtVerify confere a assinatura e a validade do token.
        // Se alguém editar o token no navegador, a assinatura não bate e cai no catch.
        const { payload } = await jwtVerify(token, chave);
        if (typeof payload.id !== "string" && typeof payload.id !== "number") throw new Error("Token sem id");
        idUsuario = String(payload.id);
    } catch {
        return NextResponse.json({ error: "Sessão inválida, faça login de novo" }, { status: 401 });
    }

    // ==== 2. O CORPO TEM O FORMATO CERTO? ====
    let corpo: unknown;
    try {
        corpo = await request.json();
    } catch {
        return NextResponse.json({ error: "Corpo da requisição inválido" }, { status: 400 });
    }

    const validacao = recordeSchema.safeParse(corpo);
    if (!validacao.success) {
        return NextResponse.json({ error: validacao.error.issues[0].message }, { status: 400 });
    }
    const { historico, pontos, data } = validacao.data;

    // ==== 3. É O DESAFIO DE HOJE (OU DE ONTEM)? ====
    // "Ontem" é aceito para não perder a partida de quem começou antes da meia-noite e terminou depois.
    // Datas mais antigas são recusadas: senão daria para gravar recorde de dias passados
    // depois de ver o caminho dos outros jogadores no ranking.
    if (data !== dataEmBrasilia(0) && data !== dataEmBrasilia(1)) {
        return NextResponse.json({ error: "Esse desafio já encerrou" }, { status: 400 });
    }

    // ==== 4. BUSCA A PALAVRA DO DIA NO BANCO ====
    const { data: palavraDoDia, error: erroPalavra } = await supabaseAdmin
        .from("palavras_do_dia")
        .select("id, inicial, objetivo")
        .eq("data", data)
        .maybeSingle(); // null se não existir (sem lançar erro)

    if (erroPalavra) {
        // O erro do Supabase aparece como "{}" se for logado direto, então logamos os campos.
        console.error("[recordes] erro ao buscar palavra do dia:", erroPalavra.code, erroPalavra.message);
        return NextResponse.json({ error: "Erro ao salvar recorde" }, { status: 500 });
    }
    if (!palavraDoDia) {
        return NextResponse.json({ error: "Desafio não encontrado" }, { status: 404 });
    }

    // ==== 5. A PARTIDA FAZ SENTIDO? ====
    // Começou na página inicial do dia?
    if (!mesmaPagina(historico[0], palavraDoDia.inicial)) {
        return NextResponse.json({ error: "A partida não começa na página do desafio" }, { status: 400 });
    }
    // Terminou na página objetivo do dia?
    if (!mesmaPagina(historico[historico.length - 1], palavraDoDia.objetivo)) {
        return NextResponse.json({ error: "A partida não termina no objetivo do desafio" }, { status: 400 });
    }
    // Cada salto custa 1 ponto, e voltar só soma pontos. Então os pontos nunca podem ser
    // menores que o número de saltos (páginas do histórico menos a inicial).
    const saltos = historico.length - 1;
    if (pontos < saltos) {
        return NextResponse.json({ error: "Pontuação inválida" }, { status: 400 });
    }

    // ==== 6. GRAVA O RECORDE ====
    // upsert com ignoreDuplicates: se o usuário já tem recorde nesse desafio, mantém o primeiro
    // (mesma regra de antes). O conflito é detectado pela restrição única (id_usuario, id_palavra_do_dia).
    const { error: erroGravar } = await supabaseAdmin
        .from("recordes")
        .upsert(
            { id_usuario: idUsuario, pontos, id_palavra_do_dia: palavraDoDia.id },
            { onConflict: "id_usuario,id_palavra_do_dia", ignoreDuplicates: true },
        );

    if (erroGravar) {
        console.error("[recordes] erro ao gravar recorde:", erroGravar.code, erroGravar.message);
        return NextResponse.json({ error: "Erro ao salvar recorde" }, { status: 500 });
    }

    // Devolve o id da palavra do dia para o navegador atualizar a lista de recordes.
    return NextResponse.json({ ok: true, idPalavraDoDia: palavraDoDia.id }, { status: 200 });
}
