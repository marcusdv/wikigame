// ==== DATA NO FUSO DE BRASÍLIA (UTC-3), FORMATO "YYYY-MM-DD" ====
//
// O desafio diário troca à meia-noite de Brasília para TODO mundo, não importa o fuso de quem joga.
// Essa data ("2026-11-26") é a "seed" do desafio: identifica a linha em `palavras_do_dia`, a chave do
// progresso no localStorage e o dia do recorde.
//
// Como funciona: pega o horário UTC, tira 3 horas e lê a data em UTC. Ex.: 01:30 UTC do dia 27
// = 22:30 do dia 26 em Brasília → "2026-11-26".
//
// Usada no navegador (DesafioDiario, página de recordes) e no servidor (rotas de recordes e de
// palavra do dia). Por isso é uma função pura, sem nada de React ou de Node.
//
// `diasAtras`: 0 = hoje, 1 = ontem...
export function dataEmBrasilia(diasAtras = 0): string {
    const TRES_HORAS = 3 * 60 * 60 * 1000;
    const UM_DIA = 24 * 60 * 60 * 1000;
    const d = new Date(Date.now() - TRES_HORAS - diasAtras * UM_DIA);
    const ano = d.getUTCFullYear();
    const mes = String(d.getUTCMonth() + 1).padStart(2, "0");
    const dia = String(d.getUTCDate()).padStart(2, "0");
    return `${ano}-${mes}-${dia}`;
}
