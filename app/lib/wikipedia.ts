// ==== CONSULTAS À WIKIPEDIA FEITAS PELO SERVIDOR ====
// Usado pelas rotas (app/api/...). Não importar em componentes "use client".

// User-Agent das chamadas à Wikipedia. A Wikipedia pede um que identifique o app; sem ele, pode
// bloquear pedidos vindos de servidores (Vercel). Vem da variável de ambiente WIKIPEDIA_USER_AGENT
// (no .env.local e na Vercel), para um contato pessoal não ficar escrito no código nem no GitHub.
// Sem a variável, usa um valor genérico que identifica o app pelo site.
export const USER_AGENT = process.env.WIKIPEDIA_USER_AGENT ?? "WikiRun/1.0 (https://wikigame-five.vercel.app)";

export type NomesDaPagina = {
    titulo: string; // título oficial, ex.: "Avalancha"
    nomes: string[]; // todos os nomes que valem: o que foi pedido + título oficial + apelidos
};

// ==== BUSCA O TÍTULO OFICIAL E OS APELIDOS DE UMA PÁGINA ====
//
// Uma requisição só à API de consulta da Wikipedia:
//   - `redirects=1`: se o nome pedido for um apelido, segue até o título oficial ("Avalanche" → "Avalancha");
//   - `prop=redirects`: lista os nomes que levam à página (Alude, Corredor de avalanche...);
//   - `rdlimit=max`: até 500 apelidos (páginas com mais que isso são raríssimas).
//
// Exemplo: buscarNomesDaPagina("Avalanche") →
//   { titulo: "Avalancha", nomes: ["Avalanche", "Avalancha", "Alude", "Corredor de avalanche", "Para-avalanche"] }
//
// Devolve null se a página não existir. Lança erro se a Wikipedia não responder.
export async function buscarNomesDaPagina(pagina: string): Promise<NomesDaPagina | null> {
    const parametros = new URLSearchParams({
        action: "query",
        titles: pagina,
        redirects: "1",
        prop: "redirects",
        rdlimit: "max",
        format: "json",
        formatversion: "2",
    });

    const resposta = await fetch(`https://pt.wikipedia.org/w/api.php?${parametros}`, {
        headers: { "User-Agent": USER_AGENT },
    });
    if (!resposta.ok) throw new Error(`Wikipedia respondeu ${resposta.status}`);

    const dados = await resposta.json();
    const paginaEncontrada = dados.query?.pages?.[0];
    if (!paginaEncontrada || paginaEncontrada.missing) return null;

    const titulo: string = paginaEncontrada.title;
    const apelidos: string[] = (paginaEncontrada.redirects ?? []).map((r: { title: string }) => r.title);

    // Set remove repetidos (ex.: quando o nome pedido já é o título oficial).
    const nomes = [...new Set([pagina, titulo, ...apelidos])];
    return { titulo, nomes };
}
