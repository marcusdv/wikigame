// ==== REGRA DE "ESSE NOME VALE A VITÓRIA?" ====
//
// Compartilhada pelo jogo (navegador, gameReducer) e pelo servidor (rota de recordes), para os dois
// seguirem EXATAMENTE a mesma regra.
//
// Por que existe: uma página da Wikipedia tem um título oficial e vários apelidos (redirecionamentos).
// Ex.: "Avalancha" é o título oficial; "Avalanche", "Alude"... levam a ela.
// O jogador vence se o nome do link clicado OU o título da página que abriu estiver na lista de nomes
// do objetivo (o próprio objetivo + título oficial + apelidos).

// Deixa dois títulos comparáveis: sem diferença de maiúsculas, sem espaços nas pontas e com "_" virando
// espaço ("Estados_Unidos" e "estados unidos " viram "estados unidos").
export function normalizarTitulo(titulo: string): string {
    return titulo.replace(/_/g, " ").trim().toLocaleLowerCase();
}

// true se algum dos candidatos (ex.: título da página e nome do link) estiver na lista de nomes.
// `nomesQueValem` deve incluir o próprio objetivo; candidatos vazios ou indefinidos são ignorados.
export function valeVitoria(nomesQueValem: string[], ...candidatos: (string | undefined)[]): boolean {
    const nomes = new Set(nomesQueValem.map(normalizarTitulo));
    return candidatos.some((candidato) => candidato !== undefined && candidato !== "" && nomes.has(normalizarTitulo(candidato)));
}
