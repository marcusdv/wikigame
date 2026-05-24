type FooterProps = {
    historico: string[];
};

export default function Footer({ historico }: FooterProps) {
    const ultimoNo = historico[historico.length - 1] || "Início";

    return (
        <footer className="bg-slate-800 border-t-4 border-blue-500 mt-12">
            <div className="max-w-5xl mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="hidden sm:flex flex-col gap-1">
                    <p className="pixel-font text-slate-500 select-none" style={{ fontSize: "9px" }}>
                        WIKIGAME v1.0.0
                    </p>
                    <a
                        href="https://www.wikipedia.org"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pixel-font text-slate-500 hover:text-slate-300 transition-colors"
                        style={{ fontSize: "8px" }}
                    >
                        Conteúdo © Wikipedia
                    </a>
                </div>

                <div
                    className="nes-container is-dark is-rounded select-none w-full sm:w-auto"
                    style={{ padding: "8px 20px", borderColor: "#1e40af" }}
                >
                    <div className="flex items-center justify-center gap-5">
                        <div className="flex items-center gap-2">
                            <span className="pixel-font text-blue-400" style={{ fontSize: "8px" }}>
                                PASSOS:
                            </span>
                            <span className="pixel-font text-white" style={{ fontSize: "13px" }}>
                                {historico.length - 1}
                            </span>
                        </div>
                        <span className="pixel-font text-slate-600" style={{ fontSize: "10px" }}>
                            |
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="pixel-font text-blue-400" style={{ fontSize: "8px" }}>
                                PÁGINA:
                            </span>
                            <span
                                className="pixel-font text-slate-300 truncate"
                                style={{ fontSize: "9px", maxWidth: "150px" }}
                                title={ultimoNo}
                            >
                                {ultimoNo}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center sm:items-end gap-1">
                    <span className="pixel-font text-slate-500 select-none" style={{ fontSize: "9px" }}>
                        by Marcus
                    </span>
                    <a
                        href="mailto:marcus.vinicius.bittencourt.c@gmail.com"
                        className="pixel-font text-blue-400 hover:text-blue-300 transition-colors"
                        style={{ fontSize: "8px" }}
                    >
                        marcus.vinicius.bittencourt.c@gmail.com
                    </a>
                </div>
            </div>
        </footer>
    );
}
