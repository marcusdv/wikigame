type FooterProps = {
    historico: string[];
};

export default function Footer({ historico }: FooterProps) {
    // Pega o último item do histórico para exibir a página atual no rodapé.
    // O fallback "Início" evita exibir undefined se o histórico estiver vazio.
    const ultimoNo = historico[historico.length - 1] || "Início";

    return (
        <footer className="bg-slate-950 text-slate-400 border-t border-slate-900/80 mt-12 transition-all">
            <div className="max-w-5xl mx-auto px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
                {/* Identidade do projeto */}
                <div className="flex items-center gap-2 select-none">
                    <span className="text-emerald-400 font-mono font-bold animate-pulse">&lt;/&gt;</span>
                    <p className="font-medium tracking-wide">
                        WikiGame <span className="text-slate-700">|</span>{" "}
                        <span className="text-slate-500 font-mono">v1.0.0</span>
                    </p>
                </div>

                {/* Estatísticas rápidas da partida atual: passos dados e página onde o jogador está */}
                <div className="flex items-center gap-6 bg-slate-900/40 border border-slate-900/60 px-4 py-2 rounded-xl text-xs font-mono select-none">
                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Passos:</span>
                        <span className="text-white font-bold">{historico.length - 1}</span>
                    </div>
                    <span className="text-slate-800">|</span>
                    <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Página Atual:</span>
                        <span className="text-amber-400 font-bold truncate max-w-37.5" title={ultimoNo}>
                            {ultimoNo}
                        </span>
                    </div>
                </div>

                {/* Créditos e link para portfólio */}
                <div className="flex items-center gap-4 text-xs">
                    <span className="text-slate-600 font-mono select-none">Criado por Marcus</span>
                    <a
                        href="https://shre.ink/7lQx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-slate-900 hover:bg-indigo-950 hover:text-white px-3 py-1.5 rounded-lg border border-slate-900 transition-all flex items-center gap-1 hover:border-indigo-900/50"
                    >
                        💻 Portfólio
                    </a>
                </div>
            </div>
        </footer>
    );
}
