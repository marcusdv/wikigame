"use client";

import { useRef, useEffect } from "react";

type BarraSuperiorFixaProps = {
    historico: string[];
    pontos: number;
    handleVoltar: () => void;
    pontoFlutuante: { id: number; valor: number } | null;
    paginaObjetivo: string;
    handleNavegarParaHistorico: (index: number) => void;
    reiniciarJogo: () => void;
};

const BTN_STYLE = { fontSize: "16px" } as const;

export default function BarraSuperiorFixa({
    historico,
    pontos,
    handleVoltar,
    pontoFlutuante,
    paginaObjetivo,
    handleNavegarParaHistorico,
    reiniciarJogo,
}: BarraSuperiorFixaProps) {
    const breadcrumbRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (breadcrumbRef.current) {
            breadcrumbRef.current.scrollLeft = breadcrumbRef.current.scrollWidth;
        }
    }, [historico]);

    return (
        <div className="sticky top-0 z-50 bg-slate-700 border-b-4 border-blue-400 shadow-lg">
            {/*
              Mobile:  grid 3 colunas
                Row 1: [Voltar] [Passos] [Novo]
                Row 2: [Objetivo — span 3]
              Desktop (md+): grid [auto 1fr auto]
                Row 1: [Voltar] [Objetivo] [Passos + Novo]
            */}
            <div className="grid grid-cols-3 md:grid-cols-[auto_1fr_auto] items-stretch">
                {/* ── VOLTAR ── */}
                <div className="col-start-1 row-start-1 flex items-center justify-center p-3 md:pl-5 md:pr-4 border-r-2 border-slate-500">
                    <div className="relative">
                        <div
                            className="absolute -top-2 -right-3 rotate-12 z-10 rounded pointer-events-none pixel-font bg-red-600 text-white"
                            style={{ fontSize: "12px", padding: "2px 5px" }}
                        >
                            +2
                        </div>
                        <button
                            onClick={handleVoltar}
                            disabled={historico.length <= 1}
                            className={`nes-btn ${historico.length <= 1 ? "is-disabled" : "is-primary"} pixel-font`}
                            style={BTN_STYLE}
                        >
                            ←
                        </button>
                    </div>
                </div>

                {/* ── OBJETIVO ──
                    Mobile:  col 1-3, row 2
                    Desktop: col 2,   row 1 */}
                <div
                    className="col-span-3 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1
                                flex flex-col items-center justify-center text-center
                                py-3 px-4 overflow-hidden
                                border-t-2 border-slate-600 md:border-t-0"
                >
                    <span className="pixel-font text-blue-300 tracking-widest" style={{ fontSize: "9px" }}>
                        ★ Página do Dia ★
                    </span>
                    <span
                        className="pixel-font text-white leading-tight line-clamp-2 mt-1"
                        style={{ fontSize: "28px" }}
                        title={paginaObjetivo}
                    >
                        {paginaObjetivo}
                    </span>
                </div>

                {/* ── PASSOS + NOVO ──
                    Mobile:  col 2-3, row 1 — grid interno 2 colunas
                    Desktop: col 3,   row 1 — flex row */}
                <div
                    className="col-start-2 col-span-2 row-start-1
                                md:col-start-3 md:col-span-1 md:row-start-1
                                grid grid-cols-2 md:flex md:flex-row md:items-center
                                border-l-2 border-slate-500 md:gap-5 md:pr-5 md:pl-4"
                >
                    {/* Passos */}
                    <div className="flex flex-col items-center justify-center py-2 px-3 border-r-2 border-slate-600 md:border-r-0">
                        <div className="pixel-font text-blue-300 mb-1" style={{ fontSize: "9px" }}>
                            PASSOS
                        </div>
                        <div
                            className="pixel-font text-white relative inline-block"
                            style={{ fontSize: "28px", lineHeight: 1 }}
                        >
                            {pontos}
                            {pontoFlutuante && (
                                <div
                                    key={pontoFlutuante.id}
                                    className="absolute inset-0 flex items-center justify-center pixel-font text-blue-300 pointer-events-none animate-float-up z-50"
                                    style={{ fontSize: "22px" }}
                                >
                                    +{pontoFlutuante.valor}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Reiniciar */}
                    <div className="flex items-center justify-center py-2 px-3">
                        <button
                            onClick={reiniciarJogo}
                            title="Reiniciar Corrida"
                            className="nes-btn is-primary pixel-font"
                            style={BTN_STYLE}
                        >
                            ↺
                        </button>
                    </div>
                </div>
            </div>

            {/* ── BREADCRUMB ── */}
            {historico.length > 0 && (
                <div
                    ref={breadcrumbRef}
                    className="border-t-2 border-slate-600 bg-slate-800 px-5 py-2.5 flex items-center gap-3 overflow-x-auto no-scrollbar"
                >
                    {historico.map((item, index) => {
                        const ehOUltimo = index === historico.length - 1;
                        return (
                            <span key={index} className="flex items-center gap-3 shrink-0 whitespace-nowrap">
                                <button
                                    onClick={() => handleNavegarParaHistorico(index)}
                                    disabled={ehOUltimo}
                                    title={ehOUltimo ? "" : "Voltar para esta página (+2 pontos)"}
                                    className={`pixel-font shrink-0 transition-colors ${
                                        ehOUltimo
                                            ? "text-blue-300 cursor-default"
                                            : "text-slate-400 hover:text-white cursor-pointer"
                                    }`}
                                    style={{ fontSize: "11px" }}
                                >
                                    {item}
                                </button>
                                {!ehOUltimo && (
                                    <span className="text-slate-500 pixel-font shrink-0" style={{ fontSize: "11px" }}>
                                        /
                                    </span>
                                )}
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
