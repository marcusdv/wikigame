import { useState } from "react";

type SecoesType = {
    secoesDaPagina: { text: string; index: number }[];
    irParaSecao: (index: number) => void;
};

export default function Secoes({ secoesDaPagina, irParaSecao }: SecoesType) {
    const [menuSecoesAberto, setMenuSecoesAberto] = useState(true);

    const secoesCopia = [{ text: "Início", index: -1 }, ...secoesDaPagina];

    return (
        <>
            {secoesCopia.length > 1 && (
                <div className="fixed right-2 bottom-2 z-20 flex flex-col items-end pixel-font">
                    {/* painel de seções */}
                    {menuSecoesAberto && (
                        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto overflow-x-hidden max-w-50 md:max-w-100 p-2">
                            {secoesCopia.map((secao) => (
                                <button
                                    key={secao.index}
                                    onClick={() =>
                                        secao.index === -1
                                            ? window.scrollTo({ top: 0, behavior: "smooth" })
                                            : irParaSecao(secao.index)
                                    }
                                    className="text-left flex gap-2 items-center text-md text-white hover:text-amber-400 bg-slate-950/80 hover:bg-slate-700/60 px-2 py-1 w-full truncate transition-colors"
                                    style={{ fontSize: window.innerWidth < 768 ? 8 : 9, borderRadius: 3 }}
                                >
                                    <span>▶</span>
                                    <span className=" overflow-x-hidden">{secao.text}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* botão de toggle */}
                    <button
                        onClick={() => setMenuSecoesAberto((v) => !v)}
                        className={`nes-btn ${menuSecoesAberto ? "" : "is-primary "}`}
                        style={{ fontSize: 8, padding: "6px 12px" }}
                        title={menuSecoesAberto ? "Ocultar seções" : "Mostrar seções"}
                    >
                        SEÇÕES
                    </button>
                </div>
            )}
        </>
    );
}
