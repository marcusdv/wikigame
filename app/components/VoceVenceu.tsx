type VoceVenceuProps = {
    historico: string[];
    pontos: number;
    iniciarNovoJogo: () => void;
};

export default function VoceVenceu({ historico, pontos, iniciarNovoJogo }: VoceVenceuProps) {
    return (
        <div className="fixed inset-0 z-1000 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl max-w-xl w-full text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Detalhes de luz de fundo */}
                <div className="absolute -top-10 -left-10 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl"></div>

                <div className="text-6xl mb-4 ">🏆</div>

                <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-linear-to-r from-amber-400 via-yellow-300 to-emerald-400 mb-2">
                    VITÓRIA!
                </h2>
                <p className="text-slate-400 text-xs mb-6">
                    Você correu com sucesso pela Wikipedia e atingiu o destino final!
                </p>

                {/* Grid de Estatísticas */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-slate-950/50 border border-slate-800/60 p-4 rounded-2xl">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1 font-bold">
                            Número de Passos
                        </span>
                        <span className="text-2xl font-black text-white">{historico.length - 1}</span>
                    </div>
                    <div className="bg-slate-950/50 border border-slate-800/60 p-4 rounded-2xl">
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1 font-bold">
                            Pontos Finais
                        </span>
                        <span className="text-2xl font-black text-amber-400">{pontos}</span>
                    </div>
                </div>

                {/* Trilha/Histórico percorrido */}
                <div className="bg-slate-950/40 border border-slate-800/60 p-4 rounded-2xl text-left mb-6 max-h-35 overflow-y-auto">
                    <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-2 font-black font-mono">
                        Caminho da Vitória
                    </span>
                    <div className="flex flex-col gap-1.5">
                        {historico.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs">
                                <span className="w-4 h-4 flex items-center justify-center rounded-full bg-slate-800 text-slate-400 text-[9px] font-bold font-mono">
                                    {idx}
                                </span>
                                <span
                                    className={
                                        idx === historico.length - 1
                                            ? "text-emerald-400 font-bold"
                                            : "text-slate-300 truncate"
                                    }
                                >
                                    {item}
                                </span>
                                {idx < historico.length - 1 && <span className="text-slate-600 text-[10px]">➔</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Botão de reiniciar */}
                <button
                    onClick={iniciarNovoJogo}
                    className="w-full bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm py-4 rounded-2xl transition-all shadow-lg shadow-emerald-500/10 active:scale-95 cursor-pointer"
                >
                    Jogar Novamente
                </button>
            </div>
        </div>
    );
}
