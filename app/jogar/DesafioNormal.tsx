"use client";
import { useGameLogic } from "../lib/useGameLogic";
import BarraSuperiorFixa from "../components/BarraSuperiorFixa";
import Footer from "../components/Footer";
import VoceVenceu from "../components/VoceVenceuTela";
import { sortearJogo } from "../lib/sotearJogo";
import { arrPaginasIniciais } from "../data/paginasIniciais";
import { arrPaginasObjetivo } from "../data/paginasObjetivo";
import { useState } from "react";

export default function DesafioNormal() {
    // Lazy initializer. Quando passa uma callback, o react não chama a função em todo o re-render. Somente na primeira vez.
    const [jogo] = useState<{ start: string; target: string }>(() =>
        sortearJogo(arrPaginasIniciais, arrPaginasObjetivo),
    );

    const {
        carregando,
        voceVenceu,
        historico,
        pontos,
        paginaObjetivo,
        pontoFlutuante,
        wikiHtml,
        iniciarNovoJogo,
        handleBotaoVoltar,
        handleNavegarPeloHistorico,
        handleLinkClicado,
    } = useGameLogic(jogo.start, jogo.target);

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
            {voceVenceu && (
                <VoceVenceu
                    historico={historico}
                    pontos={pontos}
                    iniciarNovoJogo={iniciarNovoJogo}
                    modoDeJogo={"aleatorio"}
                />
            )}

            <div>
                {/* Barra fixa com HUD de pontos, breadcrumb do histórico e objetivo */}
                <BarraSuperiorFixa
                    historico={historico}
                    pontos={pontos}
                    titulo={"Encontrar Página"}
                    handleBotaoVoltar={handleBotaoVoltar}
                    pontoFlutuante={pontoFlutuante}
                    paginaObjetivo={paginaObjetivo}
                    handleNavegarParaHistorico={handleNavegarPeloHistorico}
                    reiniciarJogo={iniciarNovoJogo}
                    tema={"jogoNormal"}
                />

                {/* Container do artigo. Delegamos cliques aqui para capturar qualquer link filho. */}
                <div
                    onClick={handleLinkClicado}
                    id="wikicontent"
                    className="my-3 px-4 sm:px-8 py-6  max-w-7xl mx-auto bg-white shadow-xl min-h-screen"
                    dangerouslySetInnerHTML={{ __html: wikiHtml }}
                />
            </div>

            <Footer historico={historico} pontos={pontos} />
        </div>
    );
}
