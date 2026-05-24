"use client";

import { useEffect, useRef, useState } from "react";
import BarraSuperiorFixa from "./BarraSuperiorFixa";
import Footer from "./Footer";
import { palavrasObjetivo } from "../../data/objetivos";
import { palavrasIniciais } from "../../data/inicial";
import VoceVenceu from "./VoceVenceu";

// Sorteia páginas de início e objetivo sem repetição.
// Definida fora do componente para ser usada como lazy initializer do useState sem causar re-renders.
function sortearJogo() {
    const start = palavrasIniciais[Math.floor(Math.random() * palavrasIniciais.length)] || "América do Sul";
    let target = palavrasObjetivo[Math.floor(Math.random() * palavrasObjetivo.length)] || "Egito";
    while (target.toLowerCase() === start.toLowerCase()) {
        target = palavrasObjetivo[Math.floor(Math.random() * palavrasObjetivo.length)] || "Egito";
    }
    return { start, target };
}

export default function WikiGame() {
    // HTML cru retornado pela Wikipedia — injetado no DOM via dangerouslySetInnerHTML.
    const [wikiHtml, setWikiHtml] = useState<string>("");

    // Inicializa o jogo com páginas aleatórias uma única vez.
    // Seguro usar lazy initializer aqui pois este componente nunca é renderizado no servidor (ssr: false).
    const [jogoInicial] = useState(sortearJogo);

    // Título da página exibida agora. Muda a cada clique do jogador.
    const [paginaAtual, setPaginaAtual] = useState(jogoInicial.start);

    // Título que o jogador precisa alcançar para vencer a partida.
    const [paginaObjetivo, setPaginaObjetivo] = useState(jogoInicial.target);

    // Lista ordenada de páginas visitadas — o "rastro" do jogador nesta partida.
    // O primeiro item é sempre a página inicial; o último é onde o jogador está agora.
    const [historico, setHistorico] = useState<string[]>([jogoInicial.start]);

    // Controla a animação de +1 / +2 que flutua sobre o placar.
    // O campo `id` muda a cada disparo para forçar o React a remontar a animação,
    // mesmo que o valor (+1 ou +2) seja igual ao da vez anterior.
    const [pontoFlutuante, setPontoFlutuante] = useState<{ id: number; valor: number } | null>(null);

    // Pontuação acumulada: +1 por clique em link, +2 por cada retrocesso no histórico.
    const [pontos, setPontos] = useState<number>(0);

    // Quando true, exibe o modal de vitória sobreposto ao jogo.
    const [voceVenceu, setVoceVenceu] = useState<boolean>(false);

    // Quando true, exibe a cortina que bloqueia cliques enquanto a página carrega.
    const [carregando, setCarregando] = useState(false);

    // Contador usado como ID único para cada animação de ponto flutuante.
    // useRef evita re-render e não aciona a regra de purity do ESLint (ao contrário de Date.now()).
    const animacaoId = useRef(0);

    // Reinicia pontos, histórico e sorteia novo jogo. Chamada pelo botão de reiniciar e modal de vitória.
    const iniciarNovoJogo = () => {
        const { start, target } = sortearJogo();
        setPaginaAtual(start);
        setHistorico([start]);
        setPaginaObjetivo(target);
        setPontos(0);
        setVoceVenceu(false);
    };

    // Toda vez que paginaAtual muda, busca o HTML da nova página via nossa API proxy.
    // O proxy existe para resolver redirecionamentos e evitar CORS direto com a Wikipedia.
    useEffect(() => {
        if (!paginaAtual) return;
        async function buscarNaApiDaWiki() {
            setCarregando(true);
            try {
                const resposta = await fetch(`/api/wiki?pagina=${encodeURIComponent(paginaAtual)}`);
                const dados = await resposta.json();

                // A Wikipedia devolve o HTML renderizado dentro de dados.parse.text["*"]
                const textoHtml = dados.parse.text["*"];
                setWikiHtml(textoHtml);
            } catch {
                setWikiHtml("Ops, erro ao carregar página da Wiki. Tente outro caminho!");
            }
            setCarregando(false);
        }
        buscarNaApiDaWiki();
    }, [paginaAtual]);

    // Intercepta todos os cliques dentro do container da Wikipedia via delegação de eventos.
    // Em vez de colocar onClick em cada link, um único handler no pai captura tudo.
    const handleLinkClicado = (evento: React.MouseEvent<HTMLDivElement>) => {
        evento.preventDefault();
        const elementoClicado = evento.target;

        if (!(elementoClicado instanceof HTMLElement)) return;
        // Sobe na árvore DOM a partir do elemento clicado até achar uma tag <a>.
        // Necessário porque o jogador pode clicar num <span> ou <img> dentro do link.
        const link = elementoClicado.closest("A");
        if (!link || !(link instanceof HTMLAnchorElement)) return;

        const href = link.getAttribute("href");

        // Ignora links que não são artigos navegáveis: imagens, arquivos e páginas internas da Wikipedia.
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
            let paginaClicada = href.replace("/wiki/", "");
            paginaClicada = decodeURIComponent(paginaClicada).replace(/_/g, " ");

            setHistorico([...historico, paginaClicada]);
            setPaginaAtual(paginaClicada);

            setPontos((pontos) => pontos + 1);
            setPontoFlutuante({ id: ++animacaoId.current, valor: 1 });

            checarVitoria(paginaClicada);
        }
    };

    // Desfaz o último passo, voltando à página anterior do histórico. Custa +2 pontos.
    const handleVoltar = () => {
        if (historico.length <= 1) return;

        const copiaDoHistorico = [...historico];
        copiaDoHistorico.pop();

        const paginaAnterior = copiaDoHistorico[copiaDoHistorico.length - 1] || "";
        setPaginaAtual(paginaAnterior);
        setHistorico(copiaDoHistorico);
        setPontos((pontos) => pontos + 2);

        setPontoFlutuante({ id: ++animacaoId.current, valor: 2 });
    };

    // Permite voltar a qualquer página do histórico diretamente pelo breadcrumb.
    // Descarta tudo que veio depois do índice escolhido e aplica +2 de penalidade.
    const handleNavegarParaHistorico = (index: number) => {
        if (index === historico.length - 1) return;

        const novoHistorico = historico.slice(0, index + 1);
        const paginaAnterior = novoHistorico[novoHistorico.length - 1] || "";

        setPaginaAtual(paginaAnterior);
        setHistorico(novoHistorico);
        setPontos((pontos) => pontos + 2);

        setPontoFlutuante({ id: ++animacaoId.current, valor: 2 });
    };

    // Compara a página clicada com o objetivo, ignorando maiúsculas.
    const checarVitoria = (pagina: string) => {
        if (pagina.toLowerCase() === paginaObjetivo.toLowerCase()) {
            setVoceVenceu(true);
        }
    };

    return (
        <div className="min-h-screen flex flex-col justify-between">
            {/* Cortina semitransparente que bloqueia interação enquanto a página carrega */}
            {carregando && (
                <div className="fixed inset-0 z-999 bg-slate-950/20 backdrop-blur-2xs flex items-center justify-center">
                    <div className="bg-slate-900/90 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800">
                        <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                        <span className="text-xs font-bold tracking-wide">Carregando conteúdo...</span>
                    </div>
                </div>
            )}

            {/* Modal de vitória — aparece quando o jogador atinge o objetivo */}
            {voceVenceu && <VoceVenceu historico={historico} pontos={pontos} iniciarNovoJogo={iniciarNovoJogo} />}

            <div>
                {/* Barra fixa com HUD de pontos, breadcrumb do histórico e objetivo */}
                <BarraSuperiorFixa
                    historico={historico}
                    pontos={pontos}
                    handleVoltar={handleVoltar}
                    pontoFlutuante={pontoFlutuante}
                    paginaObjetivo={paginaObjetivo}
                    handleNavegarParaHistorico={handleNavegarParaHistorico}
                    reiniciarJogo={iniciarNovoJogo}
                />

                {/* Container do artigo. Delegamos cliques aqui para capturar qualquer link filho. */}
                <div
                    onClick={handleLinkClicado}
                    id="wikicontent"
                    className="my-10 p-10 max-w-4xl mx-auto bg-white shadow-xl min-h-screen"
                    dangerouslySetInnerHTML={{ __html: wikiHtml }}
                />
            </div>

            <Footer historico={historico} />
        </div>
    );
}
