import { arrPaginasIniciais } from "@/app/data/paginasIniciais";
import { arrPaginasObjetivo } from "@/app/data/paginasObjetivo";
import { useEffect, useRef, useState } from "react";
import { sortearJogo } from "./sotearJogo";

// Se passado uma seed, o jogo sorteado será o mesmo para todos os jogadores.
/**
 *
 * @param seed > string que determina qual será o joog
 * @param palavraInicialSorteada
 * @param palavraObjetivoSorteada
 * @returns
 */
export function useGameLogic(paginaInicialParam: string, paginaObjetivoParam: string, seed?: string) {
    // HTML cru retornado pela Wikipedia via nossa API. Injetado no DOM via dangerouslySetInnerHTML.
    const [wikiHtml, setWikiHtml] = useState<string>("");

    const [historico, setHistorico] = useState<string[]>([paginaInicialParam]); // histórico de páginas visitadas, usado para breadcrumb e navegação
    const [paginaAtual, setPaginaAtual] = useState<string>(paginaInicialParam); // começo
    const [paginaObjetivo, setPaginaObjetivo] = useState<string>(paginaObjetivoParam); // fim
    const [passos, setPassos] = useState(0); // pontuação
    const [voceVenceu, setVoceVenceu] = useState(false); // venceu?

    const [carregando, setCarregando] = useState(false); // Cortina de carregamento que aparece enquanto o HTML da Wikipedia está sendo buscado.

    // Controla a animação de +1 / +2 que flutua sobre o placar.
    // O campo `id` muda a cada disparo para forçar o React a remontar a animação,
    // mesmo que o valor (+1 ou +2) seja igual ao da vez anterior.
    const [pontoFlutuante, setPontoFlutuante] = useState<{ id: number; valor: number } | null>(null);
    const animacaoIdRef = useRef(0); // Ref para gerar IDs únicos para animações de passos flutuantes.

    // ==== BUSCA ITEM CLICADO NA API DA WIKIPEDIA ====
    // O HTML é renderizado no DOM via dangerouslySetInnerHTML, e handleLinkClicado() captura cliques em links para atualizar paginaAtual sem recarregar a página.
    useEffect(() => {
        if (!paginaAtual) return;
        async function buscarNaApiDaWiki() {
            setCarregando(true);

            try {
                const resposta = await fetch(`/api/wiki?pagina=${encodeURIComponent(paginaAtual)}`);

                // verifica se a rota retornou erro
                if (!resposta.ok) {
                    // dados.message vem do NextResponse.json({ message: "..." }) da tua rota
                    setWikiHtml(
                        `<p class="text-center text-red-500">${resposta ?? "Erro ao carregar página"} <br> Status: ${resposta.status}</p>`,
                    );
                    return;
                }

                // a route.ts empacota como json, e precisa desempacotar de novo para acessar o HTML.
                const dados = await resposta.json(); // isso é um objeto normal marcus!!!!!

                // HTML parseado da API da wikipedia
                const html = dados.parse.text["*"];
                setWikiHtml(html);
            } catch (err) {
                setWikiHtml(
                    `<p class="text-center text-red-500">Erro ao carregar página: ${err instanceof Error ? err.message : "Erro desconhecido"}</p>`,
                );
            } finally {
                setCarregando(false);
                window.scrollTo({ top: 0, behavior: "instant" });
            }

            setCarregando(false);
            window.scrollTo({ top: 0, behavior: "instant" });
        }

        buscarNaApiDaWiki();
    }, [paginaAtual]);

    // ==== INCIA NOVO JOGO ====
    const iniciarNovoJogo = () => {
        console.log("A seed", seed);
        const { start, target } = sortearJogo(arrPaginasIniciais, arrPaginasObjetivo, seed);
        setHistorico([start]);
        setPaginaAtual(start);
        setPaginaObjetivo(target);
        setPassos(0);
        setVoceVenceu(false);
    };

    // ==== MANIPULA CLIQUES NOS LINKS DO ARTIGO ====
    const handleLinkClicado = (e: React.MouseEvent<HTMLDivElement>) => {
        // Captura cliques em links dentro do artigo para atualizar o estado do jogo sem recarregar a página.

        e.preventDefault();

        const elementoClicado = e.target;

        if (!(elementoClicado instanceof HTMLElement)) return;

        // procura o link pais mais próximo do elemento clicado, caso seja um filho do link (ex: um span dentro do link)
        const linkPai = elementoClicado.closest("a");

        if (!linkPai || !(linkPai instanceof HTMLAnchorElement)) return;

        const href = linkPai.getAttribute("href"); // href é a URL relativa do link, ex: "/wiki/Am%C3%A9rica_do_Sul"

        // Ignora links que não levam a artigos da Wikipedia, como links para arquivos, ajuda, ou páginas internas.
        if (
            href &&
            (href.includes("Ficheiro:") ||
                href.includes("File:") ||
                href.includes("Ajuda:") ||
                href.includes("Wikipedia:"))
        ) {
            return;
        }

        if (href && href.startsWith("/wiki/")) {
            // Exemplo do fluxo de transformação de um link:
            // 1. Link original no HTML (href): "/wiki/Am%C3%A9rica_do_Sul"
            // 2. Após .replace()           : "Am%C3%A9rica_do_Sul"
            // 3. Após decodeURIComponent() : "América_do_Sul"
            // 4. Após .replace(/_/g, " ")  : "América do Sul" (Pronto para o histórico e UI)

            const paginaClicada = decodeURIComponent(href.replace("/wiki/", "").replace(/_/g, " "));

            setPaginaAtual(paginaClicada);
            setHistorico((historicoAnterior) => [...historicoAnterior, paginaClicada]);
            setPontoFlutuante({ id: ++animacaoIdRef.current, valor: 1 });
            setPassos((passos) => passos + 1);
            checarVitoria(paginaClicada);
        }
    };

    // ==== BOTÃO DE VOLTAR ====
    const handleBotaoVoltar = () => {
        if (historico.length <= 1) return; // Não volta se não houver histórico

        const historicoCopia = [...historico];
        historicoCopia.pop();

        const paginaAtual = historicoCopia[historicoCopia.length - 1];

        setHistorico(historicoCopia);
        setPaginaAtual(paginaAtual);
        setPassos((passos) => passos + 2);
        setPontoFlutuante({ id: ++animacaoIdRef.current, valor: 2 });
    };

    // ==== IMPEDE O FECHAMENTO ACIDENTAL DA PÁGINA ====
    // Evita que o jogador feche ou recarregue a página acidentalmente, o que faria ele perder o progresso.
    // Então mostra um alerta de confirmação antes de fechar ou recarregar a página.
    useEffect(() => {
        if (voceVenceu) return; // não bloqueia depois de vencer

        //  Impede o comportamento padrão de fechar ou recarregar a página.
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [voceVenceu]);

    // ==== BLOQUEIA CTRL+F ====
    // Mas não tem como bloquar no menu do navegador, aparentemente
    useEffect(() => {
        const bloquear = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "f") e.preventDefault();
        };
        window.addEventListener("keydown", bloquear);
        return () => window.removeEventListener("keydown", bloquear);
    }, []);

    // ==== NAVEGAÇÃO PELO HISTÓRICO ====
    // Permite navegar pelo histórico clicando diretamente nas páginas na barra superior.
    const handleNavegarPeloHistorico = (index: number) => {
        if (index === historico.length - 1) return; // Não navega para a página atual

        const novoHistorico = historico.slice(0, index + 1); // Inclui a página do índice selecionado
        const paginaAtual = novoHistorico[novoHistorico.length - 1]; // Nova página atual é a última do novo histórico

        setHistorico(novoHistorico);
        setPaginaAtual(paginaAtual);
        setPassos((passos) => passos + 2);
        setPontoFlutuante({ id: ++animacaoIdRef.current, valor: 2 });
    };

    // ==== CHECA VITÓRIA ====
    const checarVitoria = (pagina: string) => {
        if (pagina.toLowerCase() === paginaObjetivo.toLowerCase()) {
            setVoceVenceu(true);
        }
    };

    return {
        wikiHtml,
        paginaAtual,
        paginaObjetivo,
        historico,
        setHistorico,
        setPassos,
        setPaginaAtual,
        setPaginaObjetivo,
        passos,
        pontoFlutuante,
        voceVenceu,
        setVoceVenceu,
        carregando,
        setCarregando,
        iniciarNovoJogo,
        handleLinkClicado,
        handleBotaoVoltar,
        handleNavegarPeloHistorico,
        checarVitoria,
    };
}
