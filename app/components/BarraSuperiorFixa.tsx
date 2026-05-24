"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";

type BarraSuperiorFixaProps = {
    historico: string[];
    pontos: number;
    handleVoltar: () => void;
    pontoFlutuante: { id: number; valor: number } | null;
    paginaObjetivo: string;
    handleNavegarParaHistorico: (index: number) => void;
    reiniciarJogo?: () => void;
    titulo: "Desafio Diário" | "Encontrar Página";
    tema?: "desafio" | "jogoNormal";
};

const temas = {
    jogoNormal: {
        divPaiBg: "bg-slate-700",
        divPaiBorder: "border-blue-400",
        secaoBorderInterno: "border-slate-500",
        secaoBorderObjetivo: "border-slate-600",
        breadcrumbBg: "bg-slate-800",
        breadcrumbBorder: "border-slate-600",
        breadcrumbItemAtual: "text-blue-300",
        breadcrumbItemAnterior: "text-slate-400 hover:text-white",
        breadcrumbSeparador: "text-slate-500",
        labelTexto: "text-blue-300",
        valorTexto: "text-white",
        botaoToggleBg: "bg-slate-700",
        botaoToggleBorder: "border-blue-400",
        botaoToggleTexto: "text-blue-300 hover:text-white",
    },
    desafio: {
        divPaiBg: "bg-slate-900",
        divPaiBorder: "border-amber-400",
        secaoBorderInterno: "border-slate-700",
        secaoBorderObjetivo: "border-slate-700",
        breadcrumbBg: "bg-slate-950",
        breadcrumbBorder: "border-slate-700",
        breadcrumbItemAtual: "text-amber-300",
        breadcrumbItemAnterior: "text-slate-500 hover:text-white",
        breadcrumbSeparador: "text-slate-600",
        labelTexto: "text-amber-300",
        valorTexto: "text-white",
        botaoToggleBg: "bg-slate-900",
        botaoToggleBorder: "border-amber-400",
        botaoToggleTexto: "text-amber-300 hover:text-white",
    },
};

const BTN_STYLE = { fontSize: "14px", padding: "6px 24px" } as const;

export default function BarraSuperiorFixa({
    historico,
    pontos,
    handleVoltar,
    pontoFlutuante,
    paginaObjetivo,
    handleNavegarParaHistorico,
    reiniciarJogo,
    titulo,
    tema = "jogoNormal",
}: BarraSuperiorFixaProps) {
    const breadcrumbRef = useRef<HTMLDivElement>(null);
    const [hudOculto, setHudOculto] = useState(false);
    const t = temas[tema];

    useEffect(() => {
        if (breadcrumbRef.current) {
            breadcrumbRef.current.scrollLeft = breadcrumbRef.current.scrollWidth;
        }
    }, [historico]);

    return (
        <div className={`sticky top-0 z-50 select-none ${t.divPaiBg} border-b-4 ${t.divPaiBorder} shadow-lg`}>
            {/*
              Mobile:  grid 3 colunas
                Row 1: [Voltar] [Passos] [Novo]
                Row 2: [Objetivo — span 3]
              Desktop (md+): grid [auto 1fr auto]
                Row 1: [Voltar] [Objetivo] [Passos + Novo]
            */}
            <div
                style={{
                    display: "grid",
                    gridTemplateRows: hudOculto ? "0fr" : "1fr",
                    transition: "grid-template-rows 300ms ease",
                }}
            >
                <div style={{ overflow: "hidden", minHeight: 0 }}>
                    <div className="grid grid-cols-3 md:grid-cols-[auto_1fr_auto] items-stretch">
                        {/* ── VOLTAR ── */}
                        <div
                            className={`col-start-1 row-start-1 flex items-center justify-center p-3 md:pl-5 md:pr-4 border-r-2 ${t.secaoBorderInterno}`}
                        >
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
                            className={`col-span-3 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1
                                flex flex-col items-center justify-center text-center
                                py-3 px-4 overflow-hidden
                                border-t-2 ${t.secaoBorderObjetivo} md:border-t-0`}
                        >
                            <span className={`pixel-font ${t.labelTexto} tracking-widest`} style={{ fontSize: "9px" }}>
                                ★ {titulo} ★
                            </span>
                            <span
                                className={`pixel-font ${t.valorTexto} leading-tight line-clamp-2 mt-1`}
                                style={{ fontSize: "16px" }}
                                title={paginaObjetivo}
                            >
                                {paginaObjetivo}
                            </span>
                        </div>

                        {/* ── PASSOS + NOVO ──
                    Mobile:  col 2-3, row 1 — grid interno 2 colunas
                    Desktop: col 3,   row 1 — flex row */}
                        <div
                            className={`col-start-2 col-span-2 row-start-1
                                md:col-start-3 md:col-span-1 md:row-start-1
                                flex flex-row items-stretch
                                border-l-2 ${t.secaoBorderInterno}`}
                        >
                            {/* DIÁRIO */}
                            <Link
                                href="/diario"
                                className={`select-none flex flex-col items-center justify-center px-3 border-r-2 ${t.secaoBorderInterno} pixel-font transition-colors ${tema === "desafio" ? t.labelTexto + " pointer-events-none" : t.breadcrumbItemAnterior}`}
                                style={{ fontSize: "8px" }}
                            >
                                Desafio
                                <br />
                                Diário
                            </Link>
                            {/* JOGAR */}
                            <Link
                                href="/jogar"
                                className={`select-none flex flex-col items-center justify-center px-3 border-r-2 ${t.secaoBorderInterno} pixel-font transition-colors ${tema === "jogoNormal" ? t.labelTexto + " pointer-events-none" : t.breadcrumbItemAnterior}`}
                                style={{ fontSize: "8px" }}
                            >
                                Desafio
                                <br />
                                Aleatório
                            </Link>
                            {/* Passos */}
                            <div
                                className={`flex flex-col items-center justify-center py-2 px-3 border-r-2 ${t.secaoBorderObjetivo}`}
                            >
                                <div className={`pixel-font ${t.labelTexto} mb-1`} style={{ fontSize: "9px" }}>
                                    PASSOS
                                </div>
                                <div
                                    className={`pixel-font ${t.valorTexto} relative inline-block`}
                                    style={{ fontSize: "28px", lineHeight: 1 }}
                                >
                                    {pontos}
                                    {pontoFlutuante && (
                                        <div
                                            key={pontoFlutuante.id}
                                            className={`absolute inset-0 flex items-center justify-center pixel-font ${t.labelTexto} pointer-events-none animate-float-up z-50`}
                                            style={{ fontSize: "22px" }}
                                        >
                                            +{pontoFlutuante.valor}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Reiniciar */}
                            <div className="flex items-center justify-center py-2 px-3 md:pr-5">
                                <button
                                    onClick={reiniciarJogo}
                                    title="Reiniciar Corrida"
                                    disabled={!reiniciarJogo}
                                    className={`nes-btn pixel-font ${!reiniciarJogo ? "is-disabled" : "is-primary"}`}
                                    style={BTN_STYLE}
                                >
                                    ↺
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── BREADCRUMB ── */}
            {historico.length > 0 && (
                <div
                    ref={breadcrumbRef}
                    className={`border-t-2 ${t.breadcrumbBorder} ${t.breadcrumbBg} px-5 py-2.5 flex items-center gap-3 overflow-x-auto no-scrollbar`}
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
                                            ? t.breadcrumbItemAtual + " cursor-default"
                                            : t.breadcrumbItemAnterior + " cursor-pointer"
                                    }`}
                                    style={{ fontSize: "8px" }}
                                >
                                    {item}
                                </button>
                                {!ehOUltimo && (
                                    <span
                                        className={`${t.breadcrumbSeparador} pixel-font shrink-0`}
                                        style={{ fontSize: "8px" }}
                                    >
                                        /
                                    </span>
                                )}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Botão flutuante abaixo da barra no canto direito */}
            <button
                onClick={() => setHudOculto((v) => !v)}
                title={hudOculto ? "Mostrar barra" : "Ocultar barra"}
                className={`absolute -bottom-1 right-4 translate-y-full pixel-font ${t.botaoToggleBg} ${t.botaoToggleTexto} border-4 border-t-0 ${t.botaoToggleBorder} transition-colors no-outline`}
                style={{ fontSize: "10px", padding: "2px 10px 4px" }}
            >
                {hudOculto ? "▼" : "▲"}
            </button>
        </div>
    );
}
