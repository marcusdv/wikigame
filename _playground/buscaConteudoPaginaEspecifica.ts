async function buscar(palavra: string) {
    try {
        const resposta = await fetch(`http://localhost:3000/api/wiki?pagina=${encodeURIComponent(palavra)}`);

        // a route.ts empacota como json, e precisa desempacotar de novo para acessar o HTML.
        const dados = await resposta.json(); // isso é um objeto normal !!!

        // verifica se a rota retornou erro
        if (!resposta.ok) {
            // dados.message vem do NextResponse.json({ message: "..." }) da tua rota
            console.error(
                `Erro ao carregar página: ${dados.message ?? "Erro desconhecido"}. Status: ${resposta.status}`,
            );
            return;
        }

        // HTML parseado da API da wikipedia
        const html = dados.parse.text["*"];
        return html;
    } catch (err) {
        console.error(`Erro ao carregar página: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
        return;
    }
}

// teste rápido
buscar("Lista de mortes incomuns na Idade Moderna").then((dados) => {
    console.log(dados);
});
