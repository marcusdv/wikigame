import { arrPaginasIniciais } from "@/app/data/paginasIniciais";
import { arrPaginasObjetivo } from "@/app/data/paginasObjetivo";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { sortearJogo } from "./sotearJogo";
import { useToast } from "../components/Toast";

export function useGameLogic(paginaInicialParam: string, paginaObjetivoParam: string, seed?: string) {
    const [wikiHtml, setWikiHtml] = useState<string>("");

    const [historico, setHistorico] = useState<string[]>([paginaInicialParam]);
    const [paginaAtual, setPaginaAtual] = useState<string>(paginaInicialParam);
    const [paginaObjetivo, setPaginaObjetivo] = useState<string>(paginaObjetivoParam);
    const [pontos, setPontos] = useState(0);
    const [voceVenceu, setVoceVenceu] = useState(false);

    const [carregando, setCarregando] = useState(false);

    const { mostrarErro } = useToast();

    const [pontoFlutuante, setPontoFlutuante] = useState<{ id: number; valor: number } | null>(null);
    const animacaoIdRef = useRef(0);

    // Espelha o historico em uma ref para que o useEffect possa ler o valor
    // atualizado sem precisar colocá-lo nas dependências (o que causaria loop infinito).
    // Refs não causam re-render — são só uma caixinha que guarda um valor mutável.
    const historicoRef = useRef(historico);
    // useLayoutEffect sem deps roda de forma síncrona após cada render,
    // ANTES do useEffect principal — garante que a ref esteja sempre atualizada
    // quando o efeito da busca rodar, sem infringir a regra de não modificar refs durante o render.
    useLayoutEffect(() => {
        historicoRef.current = historico;
    });

    // ==== BUSCA ITEM CLICADO NA API DA WIKIPEDIA ====
    useEffect(() => {
        if (!paginaAtual) return;
        async function buscarNaApiDaWiki() {
            setCarregando(true);

            try {
                const resposta = await fetch(`/api/wiki?pagina=${encodeURIComponent(paginaAtual)}`);

                if (!resposta.ok) {
                    mostrarErro(`Erro ao buscar na API.\nStatus: ${resposta.status} ${resposta.statusText}`);
                    return;
                }

                const dados = await resposta.json();
                const html = dados.parse.text["*"];
                setWikiHtml(html);

                // Verifica se paginaAtual já é a última do histórico.
                // Se for igual, significa que é uma carga inicial, retorno pelo botão voltar,
                // ou navegação pelo breadcrumb — nenhum desses casos deve adicionar ao histórico ou somar ponto.
                //
                // Essa verificação também resolve o bug do React StrictMode, que em desenvolvimento
                // executa os efeitos duas vezes. Com cargaInicialRef (abordagem anterior), na segunda
                // execução a ref já era false e o histórico era duplicado. Com essa comparação,
                // o resultado é sempre o mesmo independente de quantas vezes o efeito rodar.
                const ultimaNoHistorico = historicoRef.current[historicoRef.current.length - 1];
                const eNavegacaoNova = paginaAtual.toLowerCase() !== ultimaNoHistorico?.toLowerCase();

                if (eNavegacaoNova) {
                    setHistorico((prev) => [...prev, paginaAtual]);
                    setPontoFlutuante({ id: ++animacaoIdRef.current, valor: 1 });
                    setPontos((p) => p + 1);
                    if (paginaAtual.toLowerCase() === paginaObjetivo.toLowerCase()) {
                        setVoceVenceu(true);
                    }
                }

                window.scrollTo({ top: 0, behavior: "instant" });
            } catch (err) {
                mostrarErro(err instanceof Error ? err.message : "Erro ao carregar página");
            } finally {
                setCarregando(false);
            }
        }

        buscarNaApiDaWiki();
    }, [paginaAtual, mostrarErro, paginaObjetivo]);

    // ==== INICIA NOVO JOGO ====
    const iniciarNovoJogo = () => {
        const { start, target } = sortearJogo(arrPaginasIniciais, arrPaginasObjetivo, seed);
        // Ao iniciar novo jogo, o histórico começa com a página inicial.
        // O efeito vai rodar para buscar o HTML, e como paginaAtual === último do histórico (start === start),
        // não vai adicionar ao histórico nem somar ponto — exatamente o comportamento correto.
        setHistorico([start]);
        setPaginaAtual(start);
        setPaginaObjetivo(target);
        setPontos(0);
        setVoceVenceu(false);
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
        if (href && (href.includes("Ficheiro:") || href.includes("File:") || href.includes("Ajuda:") || href.includes("Wikipedia:"))) {
            return;
        }

        if (href && href.startsWith("/wiki/")) {
            // Transforma o href em nome de página legível:
            // "/wiki/Am%C3%A9rica_do_Sul" → "América do Sul"
            const paginaClicada = decodeURIComponent(href.replace("/wiki/", "").replace(/_/g, " "));
            setPaginaAtual(paginaClicada);
            // Não adicionamos ao histórico aqui — o efeito faz isso após confirmar que a página carregou.
            // Assim, links quebrados não somam pontos nem entram no histórico.
        }
    };

    // ==== BOTÃO DE VOLTAR ====
    const handleBotaoVoltar = () => {
        if (historico.length <= 1) return; // nada para voltar

        const historicoCopia = [...historico];
        historicoCopia.pop();

        const paginaAnterior = historicoCopia[historicoCopia.length - 1];

        // Após o setPaginaAtual, o efeito vai rodar e buscar a página anterior.
        // Como paginaAnterior === último do novo histórico, a verificação eNavegacaoNova
        // retorna false — não adiciona ao histórico nem soma +1.
        // O +2 é somado aqui diretamente porque é a penalidade de voltar.
        setHistorico(historicoCopia);
        setPaginaAtual(paginaAnterior);
        setPontos((p) => p + 2);
        setPontoFlutuante({ id: ++animacaoIdRef.current, valor: 2 });
    };

    // ==== IMPEDE O FECHAMENTO ACIDENTAL DA PÁGINA ====
    useEffect(() => {
        if (voceVenceu) return;
        const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [voceVenceu]);

    // ==== BLOQUEIA CTRL+F ====
    useEffect(() => {
        const bloquear = (e: KeyboardEvent) => { if (e.ctrlKey && e.key === "f") e.preventDefault(); };
        window.addEventListener("keydown", bloquear);
        return () => window.removeEventListener("keydown", bloquear);
    }, []);

    // ==== NAVEGAÇÃO PELO HISTÓRICO ====
    // Permite voltar para qualquer página anterior clicando no breadcrumb.
    const handleNavegarPeloHistorico = (index: number) => {
        if (index === historico.length - 1) return; // já está nessa página

        const novoHistorico = historico.slice(0, index + 1);
        const paginaDestino = novoHistorico[novoHistorico.length - 1];

        // Mesmo raciocínio do handleBotaoVoltar: paginaDestino === último do novoHistorico,
        // então o efeito não vai adicionar ao histórico nem somar +1.
        setHistorico(novoHistorico);
        setPaginaAtual(paginaDestino);
        setPontos((p) => p + 2);
        setPontoFlutuante({ id: ++animacaoIdRef.current, valor: 2 });
    };

    return {
        wikiHtml,
        paginaAtual,
        paginaObjetivo,
        historico,
        setHistorico,
        setPontos,
        setPaginaAtual,
        setPaginaObjetivo,
        pontos,
        pontoFlutuante,
        voceVenceu,
        setVoceVenceu,
        carregando,
        setCarregando,
        iniciarNovoJogo,
        handleLinkClicado,
        handleBotaoVoltar,
        handleNavegarPeloHistorico,
    };
}
