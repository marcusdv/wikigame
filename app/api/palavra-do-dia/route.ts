import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/app/lib/supabaseAdmin";
import { sortearJogo } from "@/app/lib/sortearJogo";
import { dataEmBrasilia } from "@/app/lib/dataBrasilia";
import { arrPaginasIniciais } from "@/app/dados/paginasIniciais";
import { arrPaginasObjetivo } from "@/app/dados/paginasObjetivo";

// ==== ROTA QUE ENTREGA (E, SE PRECISAR, CRIA) A PALAVRA DO DIA ====
//
// POR QUE ESTA ROTA EXISTE
// Antes, o navegador do PRIMEIRO visitante do dia sorteava a palavra e gravava em `palavras_do_dia`
// com a chave pública (anon). Como essa chave é pública, qualquer pessoa podia gravar ANTES a linha
// de amanhã com as palavras que quisesse e trocar o desafio de todo mundo.
//
// COMO FICA AGORA
// Continua no mesmo modelo gratuito: a palavra é criada no primeiro acesso do dia (a Vercel só roda
// a função quando alguém acessa). O que muda é QUEM grava: o servidor, com o supabaseAdmin.
// O navegador só pergunta "qual é a palavra de hoje?". Depois disso, o INSERT do anon em
// `palavras_do_dia` pode ser removido no Supabase.
//
// Exemplo de chamada (feita pelo DesafioDiario):
//   GET /api/palavra-do-dia  →  { "id": 42, "inicial": "Laika", "objetivo": "Chocolate", "data": "2026-11-26" }

// Roda a cada pedido, nunca uma versão guardada (a palavra muda todo dia).
// GET já não é cacheado por padrão nesta versão do Next; isto só deixa a intenção explícita.
export const dynamic = "force-dynamic";

// Código de erro do Postgres para "violação de chave única": outra pessoa criou a linha desse dia
// no mesmo instante (a coluna `data` é única).
const CODIGO_DUPLICADO = "23505";

// Busca a linha de uma data. Devolve a linha, null (não existe) ou lança o erro do banco.
async function buscarPalavraDoDia(data: string) {
    const { data: linha, error } = await supabaseAdmin
        .from("palavras_do_dia")
        .select("id, inicial, objetivo, data")
        .eq("data", data)
        .maybeSingle(); // null se não existir (sem lançar erro)
    if (error) throw error;
    return linha;
}

export async function GET() {
    // A data é calculada AQUI, no servidor: o navegador não escolhe de que dia é o desafio.
    const data = dataEmBrasilia();

    try {
        // ==== 1. JÁ EXISTE A PALAVRA DE HOJE? ====
        const existente = await buscarPalavraDoDia(data);
        if (existente) return NextResponse.json(existente);

        // ==== 2. NÃO EXISTE: SORTEIA E GRAVA ====
        // sortearJogo com seed é determinístico: a mesma data sempre dá o mesmo par de páginas.
        const { start, target } = sortearJogo(arrPaginasIniciais, arrPaginasObjetivo, data);

        const { data: criada, error: erroInsert } = await supabaseAdmin
            .from("palavras_do_dia")
            .insert({ inicial: start, objetivo: target, data })
            .select("id, inicial, objetivo, data")
            .single();

        if (!erroInsert) return NextResponse.json(criada);

        // ==== 3. DUAS PESSOAS CRIARAM AO MESMO TEMPO ====
        // As duas viram "não existe" e tentaram gravar; a segunda recebe erro de duplicidade.
        // Não é um problema: basta buscar a linha que a primeira acabou de gravar.
        // (Antes, nesse caso, o diário ficava com a tela em branco: item 7 do TODO.)
        if (erroInsert.code === CODIGO_DUPLICADO) {
            const daOutraPessoa = await buscarPalavraDoDia(data);
            if (daOutraPessoa) return NextResponse.json(daOutraPessoa);
        }

        throw erroInsert;
    } catch (err) {
        // O erro do Supabase aparece como "{}" se for logado direto, então logamos os campos.
        const erro = err as { code?: string; message?: string };
        console.error("[palavra-do-dia] erro:", erro.code, erro.message);
        return NextResponse.json({ error: "Erro ao carregar o desafio do dia" }, { status: 500 });
    }
}
