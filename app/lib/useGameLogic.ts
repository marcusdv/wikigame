import { useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { useToast } from "../components/Toast";
import { gameReducer, GameState } from "./gameReducer";

export function useGameLogic(paginaInicialParam: string, paginaObjetivoParam: string) {
    const estadoInicial: GameState = {
        historico: [paginaInicialParam],
        paginaAtual: paginaInicialParam,
        pontos: 0,
        paginaObjetivo: paginaObjetivoParam,
        voceVenceu: false,
        carregando: false,
    };

    const [state, dispatch] = useReducer(gameReducer, estadoInicial);
    const [wikiHtml, setWikiHtml] = useState("");
    const [pontoFlutuante, setPontoFlutuante] = useState<{ id: number; valor: number } | null>(null);
    const animacaoIdRef = useRef(0);

    // ativa o uso do toast no componente
    const { mostrarErro } = useToast();

    // Espelha o historico em uma ref para que o useEffect possa ler o valor
    // atualizado sem precisar colocá-lo nas dependências (o que causaria loop infinito).
    // Refs não causam re-render — são só uma caixinha que guarda um valor mutável.
    const historicoRef = useRef(state.historico);
    // useLayoutEffect sem deps roda de forma síncrona após cada render,
    // ANTES do useEffect principal — garante que a ref esteja sempre atualizada
    // quando o efeito da busca rodar, sem infringir a regra de não modificar refs durante o render.
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

                // Verifica se paginaAtual já é a última do histórico.
                // Se for igual, significa que é: uma carga inicial, retorno pelo botão voltar,
                // ou navegação pelo breadcrumb — nenhum desses casos deve adicionar ao histórico ou somar ponto.
                //
                // Essa verificação também resolve o bug do React StrictMode, que em desenvolvimento
                // executa os efeitos duas vezes. Com cargaInicialRef (abordagem anterior), na segunda
                // execução a ref já era false e o histórico era duplicado. Com essa comparação,
                // o resultado é sempre o mesmo independente de quantas vezes o efeito rodar.
                const ultimaNoHistorico = historicoRef.current[historicoRef.current.length - 1];
                const eNavegacaoNova = state.paginaAtual.toLowerCase() !== ultimaNoHistorico?.toLowerCase();

                //
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
    const carregarJogoExistente = (target: string, historico: string[], pontos: number, voceVenceu: boolean) => {
        dispatch({ type: "CARREGAR_JOGO_EXISTENTE", target, historico, pontos, voceVenceu });
    };

    // ==== MANIPULA CLIQUES NOS LINKS DO ARTIGO ====
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
        setPontoFlutuante({ id: ++animacaoIdRef.current, valor: 2 });
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

    // ==== BLOQUEIA CTRL+F ====
    useEffect(() => {
        const bloquear = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === "f") e.preventDefault();
        };
        window.addEventListener("keydown", bloquear);
        return () => window.removeEventListener("keydown", bloquear);
    }, []);

    // ==== NAVEGAÇÃO PELO HISTÓRICO ====
    // Permite voltar para qualquer página anterior clicando no breadcrumb.
    const handleNavegarPeloHistorico = (index: number) => {
        if (index === state.historico.length - 1) return; // já está nessa página

        dispatch({ type: "VOLTOU_PELO_HISTORICO", index });
        setPontoFlutuante({ id: ++animacaoIdRef.current, valor: 2 });
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
