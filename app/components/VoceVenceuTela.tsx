type VoceVenceuProps = {
    historico: string[];
    pontos: number;
    iniciarNovoJogo: () => void;
};

export default function VoceVenceu({ historico, pontos, iniciarNovoJogo }: VoceVenceuProps) {
    return (
        <div className="fixed inset-0 z-1000 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div
                className="nes-container is-dark is-rounded w-full max-w-lg text-center"
                style={{ padding: "2rem", borderColor: "#3b82f6" }}
            >
                <div className="text-5xl mb-4">🏆</div>

                <h2 className="pixel-font text-white mb-2" style={{ fontSize: "22px" }}>
                    VITÓRIA!
                </h2>
                <p className="pixel-font text-blue-400 mb-6 leading-7" style={{ fontSize: "9px" }}>
                    VOCÊ CHEGOU AO DESTINO!
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="nes-container is-dark is-rounded" style={{ padding: "0.75rem", borderColor: "#334155" }}>
                        <span className="pixel-font text-blue-400 block mb-2" style={{ fontSize: "8px" }}>PASSOS</span>
                        <span className="pixel-font text-white" style={{ fontSize: "24px" }}>
                            {historico.length - 1}
                        </span>
                    </div>
                    <div className="nes-container is-dark is-rounded" style={{ padding: "0.75rem", borderColor: "#334155" }}>
                        <span className="pixel-font text-blue-400 block mb-2" style={{ fontSize: "8px" }}>PONTOS</span>
                        <span className="pixel-font text-white" style={{ fontSize: "24px" }}>
                            {pontos}
                        </span>
                    </div>
                </div>

                <div
                    className="nes-container is-dark is-rounded text-left mb-5 overflow-y-auto"
                    style={{ padding: "0.75rem", maxHeight: "150px", borderColor: "#1e293b" }}
                >
                    <span className="pixel-font text-blue-400 block mb-3" style={{ fontSize: "8px" }}>
                        CAMINHO PERCORRIDO
                    </span>
                    <div className="flex flex-col gap-2">
                        {historico.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className="pixel-font text-slate-600 shrink-0 w-5" style={{ fontSize: "8px" }}>
                                    {idx}
                                </span>
                                <span
                                    className={`pixel-font truncate ${idx === historico.length - 1 ? "text-blue-300" : "text-slate-400"}`}
                                    style={{ fontSize: "9px" }}
                                >
                                    {item}
                                </span>
                                {idx < historico.length - 1 && (
                                    <span className="text-slate-600 shrink-0" style={{ fontSize: "10px" }}>▶</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    onClick={iniciarNovoJogo}
                    className="nes-btn is-primary w-full pixel-font"
                    style={{ fontSize: "11px" }}
                >
                    ► JOGAR NOVAMENTE
                </button>
            </div>
        </div>
    );
}
