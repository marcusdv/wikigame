"use client";
import { useGameLogic } from "../lib/useGameLogic";
import BarraSuperiorFixa from "../components/BarraSuperiorFixa";
import Footer from "../components/Footer";
import VoceVenceu from "../components/VoceVenceuTela";
import { useEffect } from "react";

type DadosLocalStorage = {
    historico: string[];
    passos: number;
};

export default function DesafioDiario() {
    // Gera a seed com a data de hoje no formato "2026-05-24".
    // Isso garante que todos os jogadores recebem o mesmo par
    // de páginas no mesmo dia, como o Wordle.

    const seed = new Date().toISOString().slice(0, 10);

    // Passa a seed pro hook — com seed, sortearJogo() é
    // determinístico em vez de aleatório.
    const {
        carregando,
        voceVenceu,
        historico,
        passos,
        setHistorico,
        setPassos,
        setPaginaAtual,
        paginaObjetivo,
        pontoFlutuante,
        wikiHtml,
        iniciarNovoJogo,
        handleVoltar,
        handleNavegarPeloHistorico,
        handleLinkClicado,
    } = useGameLogic(seed);

    useEffect(() => {
        function carregarLocalStorage() {
            try {
                const dadosSalvosJSON = localStorage.getItem(`desafio-diario-${seed}`);

                if (!dadosSalvosJSON) {
                    console.log("Nenhum progresso salvo para hoje.");
                    return;
                }

                const dados: DadosLocalStorage = JSON.parse(dadosSalvosJSON);

                console.log("OS DADOS PARSEADOS", dados);
                setHistorico(dados.historico);
                setPassos(dados.passos);
                setPaginaAtual(dados.historico[dados.historico.length - 1]);
            } catch (error) {
                // JSON.parse falha se a string estiver corrompida/inválida
                // localStorage.getItem falha se o storage estiver bloqueado
                console.error("Erro ao carregar progresso do localStorage:", error);
            }
        }
        carregarLocalStorage();
    }, [setHistorico, setPassos, setPaginaAtual, seed]);

    // Salva o progresso no localStorage a cada mudança no histórico ou passos.
    // Quero salvar sempre que o jogador fizer um movimento.
    useEffect(() => {
        if (historico.length <= 1) return;

        try {
            const dados: DadosLocalStorage = {
                historico: [...historico],
                passos,
            };
            // seed é a data de hoje, então a chave é única por dia. Formato: "desafio-diario-2026-05-24"
            localStorage.setItem(`desafio-diario-${seed}`, JSON.stringify(dados));
        } catch {
            // localStorage pode falhar se:
            // - o storage estiver cheio (quota exceeded)
            // - o browser estiver em modo privado com storage bloqueado
            // - o usuário tiver desabilitado o localStorage
            console.error("Erro ao salvar progresso");
        }
    }, [historico, passos, seed]);

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
            {voceVenceu && <VoceVenceu historico={historico} passos={passos} iniciarNovoJogo={iniciarNovoJogo} />}

            <div>
                {/* Barra fixa com HUD de pontos, breadcrumb do histórico e objetivo */}
                <BarraSuperiorFixa
                    historico={historico}
                    passos={passos}
                    handleVoltar={handleVoltar}
                    pontoFlutuante={pontoFlutuante}
                    paginaObjetivo={paginaObjetivo}
                    handleNavegarParaHistorico={handleNavegarPeloHistorico}
                    tema={"desafio"}
                    titulo={"Desafio Diário"}
                />

                {/* Container do artigo. Delegamos cliques aqui para capturar qualquer link filho. */}
                <div
                    onClick={handleLinkClicado}
                    id="wikicontent"
                    className="my-3 px-4 sm:px-8 py-6 max-w-6xl mx-auto bg-white shadow-xl min-h-screen"
                    dangerouslySetInnerHTML={{ __html: wikiHtml }}
                />
            </div>

            <Footer historico={historico} />
        </div>
    );
}
