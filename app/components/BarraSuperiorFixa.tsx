"use client";

type BarraSuperiorFixaProps = {
    historico: string[];
    pontos: number;
    handleVoltar: () => void;
    pontoFlutuante: { id: number; valor: number } | null;
    paginaObjetivo: string;
    handleNavegarParaHistorico: (index: number) => void;
    reiniciarJogo: () => void;
};

export default function BarraSuperiorFixa({
    historico,
    pontos,
    handleVoltar,
    pontoFlutuante,
    paginaObjetivo,
    handleNavegarParaHistorico,
    reiniciarJogo,
}: BarraSuperiorFixaProps) {
    return (
        <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex flex-col sm:flex-row gap-4 justify-between items-center shadow-xs transition-all duration-300">
            {/* LADO ESQUERDO: botão Voltar + breadcrumb do histórico */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <div className="relative inline-block shrink-0">
                    {/* Badge de custo fixo (+2) — informa o jogador antes de clicar */}
                    <div className="absolute -top-4 -right-4 rotate-12 bg-red-500 text-white text-xs font-black px-2.5 py-0.5 rounded-md shadow-md z-10 border-2 border-white pointer-events-none">
                        +2
                    </div>

                    <button
                        onClick={handleVoltar}
                        disabled={historico.length <= 1}
                        className={`
                          ${
                              historico.length <= 1
                                  ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-50"
                                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm active:scale-95 cursor-pointer"
                          }
                          relative px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-transparent`}
                    >
                        <svg className="w-3 h-3 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Voltar
                    </button>
                </div>

                {/* Breadcrumb clicável — mostra os últimos 5 passos do jogador.
                    Clicar em qualquer item volta para aquela página (custo +2). */}
                <div className="hidden md:flex items-center bg-slate-50 border border-slate-200 px-5 py-2.5 rounded-xl text-sm text-slate-500 shadow-inner max-w-md lg:max-w-2xl overflow-hidden">
                    <div className="flex flex-row flex-nowrap items-center gap-1.5 select-none overflow-hidden justify-end">
                        {historico.map((item, index) => {
                            // Limita o breadcrumb aos últimos 5 itens para não transbordar a barra.
                            const mostrar = index >= historico.length - 5;
                            if (!mostrar) return null;

                            const ehOUltimo = index === historico.length - 1;

                            return (
                                <span key={index} className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                                    <button
                                        onClick={() => handleNavegarParaHistorico(index)}
                                        disabled={ehOUltimo}
                                        title={ehOUltimo ? "" : `Voltar para esta página (Custo: +2 pontos)`}
                                        className={`transition-all text-sm shrink-0 whitespace-nowrap ${
                                            ehOUltimo
                                                ? "font-extrabold text-indigo-600 cursor-default"
                                                : "hover:text-indigo-500 hover:underline cursor-pointer opacity-70 font-semibold"
                                        }`}
                                    >
                                        {item}
                                    </button>
                                    {!ehOUltimo && <span className="text-slate-300 shrink-0">/</span>}
                                </span>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* LADO DIREITO: objetivo, placar e botão de reiniciar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto shrink-0">
                {/* Caixa do objetivo — mostra a página-destino que o jogador precisa atingir */}
                <div className="flex flex-col items-center sm:items-start bg-slate-50 border border-slate-200 px-6 py-2.5 rounded-2xl shadow-inner w-full sm:w-auto text-center sm:text-left shrink-0">
                    <span className="text-[11px] text-slate-400 font-black uppercase tracking-widest block leading-none mb-1 select-none">
                        Objetivo Final
                    </span>
                    <span className="text-slate-950 font-black text-lg tracking-wide block leading-none">
                        {paginaObjetivo}
                    </span>
                </div>

                {/* Placar com animação flutuante.
                    O pontoFlutuante é remontado via `key` sempre que seu `id` muda,
                    garantindo que a animação CSS rode mesmo para valores repetidos (+1 seguido de +1). */}
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 pr-2.5 pl-5 py-2.5 rounded-2xl shadow-inner relative w-full sm:w-auto justify-between sm:justify-start shrink-0">
                    <span className="text-slate-500 font-extrabold uppercase tracking-widest text-[11px] select-none">
                        Pontos
                    </span>

                    <div className="relative shrink-0">
                        <div className="bg-slate-950 text-white font-black text-2xl px-6 py-1.5 rounded-xl shadow-md min-w-[70px] text-center select-none">
                            {pontos}
                        </div>

                        {pontoFlutuante && (
                            <div
                                key={pontoFlutuante.id}
                                className="absolute inset-0 flex items-center justify-center font-black text-indigo-600 text-2xl pointer-events-none animate-float-up z-50"
                            >
                                +{pontoFlutuante.valor}
                            </div>
                        )}
                    </div>
                </div>

                {/* Botão de reiniciar — sorteia novas páginas e reseta o jogo */}
                <button
                    onClick={reiniciarJogo}
                    title="Reiniciar Corrida (Sortear novas páginas)"
                    className="p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-2xl transition-all active:scale-90 active:rotate-45 shadow-inner cursor-pointer flex items-center justify-center shrink-0"
                >
                    <svg className="w-5 h-5 stroke-[2.5]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                        />
                    </svg>
                </button>
            </div>
        </div>
    );
}
