import { useCallback, useEffect, useLayoutEffect, useReducer, useRef, useState } from "react";
import { useToast } from "../components/Toast";
import { gameReducer } from "./gameReducer";

export function useGameLogic(paginaInicialParam: string, paginaObjetivoParam: string) {
    const [state, dispatch] = useReducer(gameReducer, paginaInicialParam, () => ({
        historico: [paginaInicialParam],
        paginaAtual: paginaInicialParam,
        pontos: 0,
        paginaObjetivo: paginaObjetivoParam,
        nomesDoObjetivo: [], // preenchido pelo efeito "BUSCA OS NOMES DO OBJETIVO"
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
                setWikiHtml(html); // a página aparece na tela ANTES de checar a vitória

                // Título VERDADEIRO da página que abriu (a rota segue redirecionamentos):
                // clicou em "EUA" → abre e vem "Estados Unidos". Sem título na resposta, usa o nome pedido.
                const tituloVerdadeiro: string = dados.parse.title ?? state.paginaAtual;

                // Usamos o historicoRef aqui, verificamos se a última página é a mesma que a página atual.
                // Porque quando carregamos dados do LocalStorage, Banco ou é o primeiro acesso da página, ele não deve adicionar ao estado, pois já foi carregado.
                const ultimaPaginaNoHistorico = historicoRef.current[historicoRef.current.length - 1];
                // Compara os DOIS nomes com a última página: o pedido ("EUA") e o verdadeiro ("Estados Unidos").
                // O histórico guarda o verdadeiro, então só o nome pedido não bastaria: se este efeito rodasse
                // de novo, "EUA" ≠ "Estados Unidos" contaria o mesmo clique duas vezes.
                const ultima = ultimaPaginaNoHistorico?.toLowerCase();
                const eNavegacaoNova =
                    state.paginaAtual.toLowerCase() !== ultima && tituloVerdadeiro.toLowerCase() !== ultima;
                // Assim não entramos esse if e não colocamos a mesma página no histórico novamente.
                if (eNavegacaoNova) {
                    // O reducer guarda o título verdadeiro no histórico e checa a vitória com os DOIS nomes:
                    // o título ("Estados Unidos") e o nome do link clicado ("EUA").
                    dispatch({ type: "NAVEGOU", pagina: tituloVerdadeiro, nomeDoLink: state.paginaAtual });
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

    // ==== BUSCA OS NOMES DO OBJETIVO (1 requisição por partida) ====
    // Sempre que o objetivo muda (partida nova, jogo carregado do localStorage...), pergunta ao servidor o
    // título oficial e os apelidos do objetivo. Ex.: "Avalanche" → ["Avalanche", "Avalancha", "Alude", ...].
    // O reducer usa essa lista para reconhecer a vitória mesmo quando o objetivo é um apelido.
    // Se falhar (Wikipedia fora do ar...), o jogo segue normalmente: vale pelo menos o nome do objetivo.
    useEffect(() => {
        const objetivo = state.paginaObjetivo;
        if (!objetivo) return;

        // `cancelado` evita aplicar a resposta de um objetivo antigo se o objetivo mudar antes dela chegar.
        let cancelado = false;
        fetch(`/api/nomes-da-pagina?pagina=${encodeURIComponent(objetivo)}`)
            .then((resposta) => (resposta.ok ? resposta.json() : null))
            .then((dados: { nomes?: string[] } | null) => {
                if (cancelado || !dados?.nomes) return;
                dispatch({ type: "NOMES_DO_OBJETIVO", objetivo, nomes: dados.nomes });
            })
            .catch(() => {
                // Sem lista: a vitória continua valendo pelo nome exato do objetivo.
            });

        return () => {
            cancelado = true;
        };
    }, [state.paginaObjetivo]);

    // ==== INICIA NOVO JOGO ====
    // useCallback mantém a MESMA função entre os renders (o `dispatch` do useReducer nunca muda,
    // então não há dependências). Sem isso, a função seria recriada a cada render, e qualquer
    // useEffect que a tivesse nas dependências rodaria em todo render.
    const iniciarNovoJogo = useCallback((start: string, target: string) => {
        dispatch({ type: "NOVO_JOGO", start, target });
    }, []);

    // ==== CARREGA JOGO (LOCALSTORAGE E BANCO) ====
    // Também estável (useCallback): o DesafioDiario a usa dentro de um useEffect.
    const carregarJogoExistente = useCallback(
        (target: string, historico: string[], pontos: number, voceVenceu: boolean, custoDeVoltar: number) => {
            dispatch({ type: "CARREGAR_JOGO_EXISTENTE", target, historico, pontos, voceVenceu, custoDeVoltar });
        },
        [],
    );

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
            // O split("#") corta a seção: "/wiki/Chocolate#Hist%C3%B3ria" → "Chocolate" (a página é a mesma).
            const semSecao = href.split("#")[0];
            const paginaClicada = decodeURIComponent(semSecao.replace("/wiki/", "").replace(/_/g, " "));

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
