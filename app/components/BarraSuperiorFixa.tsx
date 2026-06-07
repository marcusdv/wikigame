"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";

type BarraSuperiorFixaProps = {
    historico: string[];
    pontos: number;
    handleBotaoVoltar: () => void;
    pontoFlutuante: { id: number; valor: number } | null;
    paginaObjetivo: string;
    handleNavegarParaHistorico: (index: number) => void;
    novoJogo?: () => void;
    titulo: "Desafio Diário" | "Encontrar Página";
    tema?: "desafio" | "jogoNormal";
};

const temas = {
    jogoNormal: {
        divPaiBg: "bg-slate-700",
        divPaiBorder: "border-blue-400",
        secaoBorderInterno: "border-slate-400",
        secaoBorderObjetivo: "border-slate-400",
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

const BTN_STYLE = { padding: "8px 20px", margin: "5px 10px" } as const;

export default function BarraSuperiorFixa({
    historico,
    pontos,
    handleBotaoVoltar,
    pontoFlutuante,
    paginaObjetivo,
    handleNavegarParaHistorico,
    novoJogo,
    titulo,
    tema = "jogoNormal",
}: BarraSuperiorFixaProps) {
    //
    const breadcrumbRef = useRef<HTMLDivElement>(null);
    const [hudOculto, setHudOculto] = useState(false);
    const t = temas[tema];

    // Toda vez que o histórico muda (ou seja, o jogador avança ou volta), rola o breadcrumb para a direita para mostrar a última página visitada.
    // Isso é feito porque o breadcrumb tem overflow-x: auto, e queremos garantir que o item mais recente (o atual) esteja sempre visível.
    useEffect(() => {
        if (breadcrumbRef.current) {
            breadcrumbRef.current.scrollLeft = breadcrumbRef.current.scrollWidth;
        }
    }, [historico]);

    return (
        <div
            className={`sticky pixel-font top-0 z-30 select-none ${t.divPaiBg} border-b-4 ${t.divPaiBorder} shadow-lg`}
        >
            {/*
              GRID — mobile 3 cols / desktop 5 cols (md:)
              ┌──────────────────────────────────────────────────────────────┐
              │ Mobile  (< md)   grid-cols-[1fr 3fr 1fr]                     │
              │  Row 1: [Voltar col1] [Link outro modo col2]  [Reiniciar col3]│
              │  Row 2: [ col1] [Título/Objetivo        col2–3]         │
              ├──────────────────────────────────────────────────────────────┤
              │ Desktop (≥ md)   grid-cols-[1fr 3fr 1fr 1fr 1fr]             │
              │  Row 1: [Voltar col1] [Título/Objetivo col2] [Outro modo col3]│
              │         [ col4] [Reiniciar col5]                        │
              └──────────────────────────────────────────────────────────────┘
            */}
            <div
                style={{
                    display: "grid",
                    gridTemplateRows: hudOculto ? "0fr" : "1fr",
                    transition: "grid-template-rows 300ms ease",
                }}
            >
                <div style={{ overflow: "hidden", minHeight: 0 }}>
                    <div className="grid grid-cols-[1fr_3fr_1fr] md:grid-cols-[1fr_3fr_1fr_1fr_1fr] items-stretch">
                        {/* ── VOLTAR — mobile col1 row1 | desktop col1 row1 ── */}
                        <div
                            className={`
                                col-start-1 row-start-1 flex items-center justify-center p-4 border-r-2 ${t.secaoBorderInterno}
                                md:pl-5 md:pr-4 
                                `}
                        >
                            <div className="relative">
                                <div
                                    className={`
                                        absolute -top-2 -right-3 rotate-12 z-10 rounded pointer-events-none   text-white
                                        ${historico.length <= 1 ? "bg-gray-500" : "bg-red-600"}
                                        `}
                                    style={{ fontSize: "14px", padding: "2px 5px" }}
                                >
                                    +2
                                </div>
                                <button
                                    onClick={handleBotaoVoltar}
                                    disabled={historico.length <= 1}
                                    className={`nes-btn ${historico.length <= 1 ? "is-disabled" : "is-primary"} `}
                                    style={BTN_STYLE}
                                >
                                    {"<"}
                                </button>
                            </div>
                        </div>

                        {/* ── TÍTULO/OBJETIVO — mobile col2-3 row2 | desktop col2 row1 ── */}
                        <div
                            className={`
                                col-start-2 col-span-2 row-start-2 flex flex-col items-center justify-center 
                                text-center py-2 overflow-hidden border-t-2 ${t.secaoBorderObjetivo} 
                                md:col-start-2 md:col-span-1 md:row-start-1 md:border-r-2 md:border-t-0
                                `}
                        >
                            <span
                                className={` ${t.labelTexto} tracking-widest w-full text-[10px] md:text-xs overflow-hidden whitespace-nowrap`}
                            >
                                ★ {titulo} ★
                            </span>
                            <span
                                className={` ${t.valorTexto} leading-tight line-clamp-2 my-1 text-sm md:text-lg break-all px-1`}
                                title={paginaObjetivo}
                            >
                                {paginaObjetivo}
                            </span>
                        </div>

                        {/* ──  — mobile col1 row2 | desktop col4 row1 ── */}
                        <div
                            className={`
                                col-start-1 row-start-2 flex flex-col items-center justify-center py-2 px-3 border-r-2 border-t-2 
                                md:col-start-4 md:row-start-1 md:border-t-0 ${t.secaoBorderInterno} 
                                `}
                        >
                            <div className={` ${t.labelTexto} mb-1`} style={{ fontSize: "9px" }}>
                                PONTOS
                            </div>
                            <div
                                className={` ${t.valorTexto} relative inline-block`}
                                style={{ fontSize: "28px", lineHeight: 1 }}
                            >
                                {pontos}
                                {pontoFlutuante && (
                                    <div
                                        key={pontoFlutuante.id}
                                        className={`absolute inset-0 flex items-center justify-center  ${t.labelTexto} pointer-events-none animate-float-up z-50`}
                                        style={{ fontSize: "22px" }}
                                    >
                                        +{pontoFlutuante.valor}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── LINK OUTRO MODO — mobile col2 row1 | desktop col3 row1 ── */}
                        <Link
                            href={tema === "jogoNormal" ? "/diario" : "/jogar"}
                            replace
                            className={`
                                col-start-2 row-start-1 flex flex-col items-center justify-center transition-colors
                                md:col-start-3 md:row-start-1 md:border-r-2 ${t.secaoBorderInterno}
                            `}
                            style={{ fontSize: "8px" }}
                        >
                            <button type="button" className="nes-btn is-primary " style={BTN_STYLE}>
                                {tema === "jogoNormal" ? (
                                    <>
                                        Desafio
                                        <br />
                                        Diário
                                    </>
                                ) : (
                                    <>
                                        Desafio
                                        <br />
                                        Aleatório
                                    </>
                                )}
                            </button>
                        </Link>

                        {/* ── REINICIAR — mobile col3 row1 | desktop col5 row1 ── */}
                        <div
                            className={`
                                    col-start-3 row-start-1 flex items-center justify-center border-l-2 ${t.secaoBorderInterno} 
                                    md:col-start-5 md:row-start-1 md:border-l-0
                                `}
                        >
                            <button
                                onClick={novoJogo}
                                title="Reiniciar Corrida"
                                disabled={!novoJogo}
                                className={`nes-btn  ${!novoJogo ? "is-disabled" : "is-error"}`}
                                style={BTN_STYLE}
                            >
                                X
                            </button>
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
                                    className={` shrink-0 transition-colors ${
                                        ehOUltimo
                                            ? t.breadcrumbItemAtual + " cursor-default"
                                            : t.breadcrumbItemAnterior + " cursor-pointer"
                                    }`}
                                    style={{ fontSize: "8px" }}
                                >
                                    {item}
                                </button>
                                {!ehOUltimo && (
                                    <span className={`${t.breadcrumbSeparador}  shrink-0`} style={{ fontSize: "8px" }}>
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
                className={`absolute -bottom-1 right-4 translate-y-full  ${t.botaoToggleBg} ${t.botaoToggleTexto} border-4 border-t-0 ${t.botaoToggleBorder} transition-colors no-outline`}
                style={{ fontSize: "10px", padding: "2px 10px 4px" }}
            >
                {hudOculto ? "▼" : "▲"}
            </button>
        </div>
    );
}
