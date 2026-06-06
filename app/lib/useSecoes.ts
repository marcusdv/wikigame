import { startTransition, useEffect, useState } from "react";

// useSecoes.ts
export function useSecoes(wikiHtml: string) {
    const [secoesDaPagina, setSecoesDaPagina] = useState<{ text: string; index: number }[]>([]);

    // ==== MONTA A LISTA DE SEÇÕES DO ARTIGO ====
    // Roda toda vez que o wikiHtml muda (ou seja, o jogador navegou para um novo artigo).
    // O useEffect garante que o DOM já foi atualizado antes de ler os h2s —
    // se lêssemos fora do efeito, o HTML novo ainda não estaria na página.
    useEffect(() => {
        if (!wikiHtml) return;

        // querySelectorAll pega todos os h2 dentro do container do artigo.
        // O filter remove os que estão ocultos pelo CSS (ex: "Ver também", "Referências").
        // getComputedStyle lê o estilo real calculado pelo navegador — diferente de
        // element.style, que só lê estilos inline. Aqui o display:none está no pai (.mw-heading),
        // por isso subimos com closest() antes de verificar.
        const h2s = Array.from(document.querySelectorAll("#wikicontent h2")).filter((h2) => {
            const pai = h2.closest(".mw-heading");
            return !pai || getComputedStyle(pai).display !== "none";
        });

        // Transforma cada h2 em { text, index } para saber o texto a exibir
        // e qual posição ele ocupa na lista (usado depois para rolar até ele).
        const lista = h2s.map((h2, index) => ({ text: h2.textContent ?? "", index }));

        // startTransition marca essa atualização como não-urgente.
        // Sem ele, o linter reclama que setState dentro de useEffect pode causar renders em cascata.
        // Com ele, o React sabe que pode adiar essa renderização se necessário.
        startTransition(() => {
            setSecoesDaPagina(lista);
        });
    }, [wikiHtml]);

    // ==== ROLA ATÉ A SEÇÃO CLICADA ====
    // Busca os h2s no momento do clique (não em cache) para garantir que
    // está lendo o DOM atual. Usa o index para encontrar o h2 certo.
    const irParaSecao = (index: number) => {
        const h2s = document.querySelectorAll("#wikicontent h2");
        h2s[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
    };

    return { secoesDaPagina, irParaSecao };
}
