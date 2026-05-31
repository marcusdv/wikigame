// ==== ENVIA A DATA E HORA DO SERVIDOR (VERCEL)
// para termos consistência de horario e data entre todos os usuários
export async function GET() {
    const d = new Date();

    // seed que usamos para gerar o jogo (que usam seed),
    // salvar no banco
    // salvar no localStorage (`desafio-diario-${seed})
    const seed = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    return Response.json({ dataCompleta: d, seed, fullDate: d });
}
