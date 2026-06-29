import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { useToast } from "../components/Toast";
import { gameReducer } from "./gameReducer";

export function useGameLogic(paginaInicialParam: string, paginaObjetivoParam: string) {
    const [state, dispatch] = useReducer(gameReducer, paginaInicialParam, () => ({
        historico: [paginaInicialParam],
        paginaAtual: paginaInicialParam,
        pontos: 0,
        paginaObjetivo: paginaObjetivoParam,
        voceVenceu: false,
        carregando: false,
        custoDeVoltar: 0,
    }));

    const [wikiHtml, setWikiHtml] = useState(""); // conteudo wiki passado pela api

    const [pontoFlutuante, setPontoFlutuante] = useState<{ id: number; valor: number } | null>(null);
    const animacaoIdRef = useRef(0);

    // ativa o uso do toast no componente
    const { mostrarErro } = useToast();

    // Espelha o historico em uma ref para que o useEffect possa ler o valor sem ter que passar o historico nas dependências e re-renderizar (o que causaria loop infinito)
    const historicoRef = useRef(state.historico); // Refs não causam re-render

    // esse hook roda antes dos useEffects, então garante que o historicoRef sempre estará atualizado
    useLayoutEffect(() => {
        historicoRef.current = state.historico;
    });

    // ==== BUSCA ITEM CLICADO NA API DA WIKIPEDIA ====
    useEffect(() => {
        if (!state.paginaAtual) return;
        async function buscarNaApiDaWiki() {
            dispatch({ type: "CARREGANDO", valor: true });

            try {
                const resposta = await fetch(`/api/wiki?pagina=${encodeURIComponent(state.paginaAtual)}`);

                if (!resposta.ok) {
                    dispatch({ type: "ERRO_AO_BUSCAR_PAGINA_ATUAL" });

                    mostrarErro(`Erro ao buscar na API.\nStatus: ${resposta.status} ${resposta.statusText}`);
                    return;
                }

                const dados = await resposta.json();
                const html = dados.parse.text["*"];
                setWikiHtml(html);

                // Usamos o historicoRef aqui, verificamos se a última página é a mesma que a página atual.
                // Porque quando carregamos dados do LocalStorage, Banco ou é o primeiro acesso da página, ele não deve adicionar ao estado, pois já foi carregado.
                const ultimaPaginaNoHistorico = historicoRef.current[historicoRef.current.length - 1];
                const eNavegacaoNova = state.paginaAtual.toLowerCase() !== ultimaPaginaNoHistorico?.toLowerCase();
                // Assim não entramos esse if e não colocamos a mesma página no histórico novamente.
                if (eNavegacaoNova) {
                    dispatch({ type: "NAVEGOU", pagina: state.paginaAtual });
                    setPontoFlutuante({ id: ++animacaoIdRef.current, valor: 1 });
                }

                window.scrollTo({ top: 0, behavior: "instant" });
            } catch (err) {
                dispatch({ type: "ERRO_AO_BUSCAR_PAGINA_ATUAL" });
                mostrarErro(err instanceof Error ? err.message : "Erro ao carregar página");
            } finally {
                dispatch({ type: "CARREGANDO", valor: false });
            }
        }

        buscarNaApiDaWiki();
    }, [state.paginaAtual, mostrarErro]);

    // ==== INICIA NOVO JOGO ====
    const iniciarNovoJogo = (start: string, target: string) => {
        dispatch({ type: "NOVO_JOGO", start, target });
    };

    // ==== CARREGA JOGO (LOCALSTORAGE E BANCO) ====
    const carregarJogoExistente = (
        target: string,
        historico: string[],
        pontos: number,
        voceVenceu: boolean,
        custoDeVoltar: number,
    ) => {
        dispatch({ type: "CARREGAR_JOGO_EXISTENTE", target, historico, pontos, voceVenceu, custoDeVoltar });
    };

    // ==== MANIPULA CLIQUES NOS LINKS DO ARTIGO E DISPARA O USEEFFECT DE BUSCA NA WIKIPEDIA====
    const handleLinkClicado = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();

        const elementoClicado = e.target;
        if (!(elementoClicado instanceof HTMLElement)) return;

        const linkPai = elementoClicado.closest("a");
        if (!linkPai || !(linkPai instanceof HTMLAnchorElement)) return;

        const href = linkPai.getAttribute("href");

        // Ignora links que não levam a artigos da Wikipedia
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
            // Transforma o href em nome de página legível:
            // "/wiki/Am%C3%A9rica_do_Sul" → "América do Sul"
            const paginaClicada = decodeURIComponent(href.replace("/wiki/", "").replace(/_/g, " "));

            dispatch({ type: "CLICOU_NUM_LINK", pagina: paginaClicada });
        }
    };

    // ==== BOTÃO DE VOLTAR ====
    const handleBotaoVoltar = () => {
        if (state.historico.length <= 1) return; // nada para voltar

        dispatch({ type: "VOLTOU" });
        setPontoFlutuante({ id: ++animacaoIdRef.current, valor: state.custoDeVoltar });
    };

    // ==== IMPEDE O FECHAMENTO ACIDENTAL DA PÁGINA ====
    useEffect(() => {
        if (state.voceVenceu) return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [state.voceVenceu]);

    // ==== NAVEGAÇÃO PELO HISTÓRICO ====
    // Permite voltar para qualquer página anterior clicando no breadcrumb.
    const handleNavegarPeloHistorico = (index: number) => {
        if (index === state.historico.length - 1) return; // já está nessa página

        dispatch({ type: "VOLTOU_PELO_HISTORICO", index });
        setPontoFlutuante({ id: ++animacaoIdRef.current, valor: state.custoDeVoltar });
    };

    return {
        wikiHtml,
        ...state,
        pontoFlutuante,
        iniciarNovoJogo,
        handleLinkClicado,
        carregarJogoExistente,
        handleBotaoVoltar,
        handleNavegarPeloHistorico,
    };
}
