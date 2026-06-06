import { useState } from "react";

type SecoesType = {
    secoesDaPagina: { text: string; index: number }[];
    irParaSecao: (index: number) => void;
};

export default function Secoes({ secoesDaPagina, irParaSecao }: SecoesType) {
    const [menuSecoesAberto, setMenuSecoesAberto] = useState(true);

    return (
        <>
            {secoesDaPagina.length > 0 && (
                <div className="fixed right-0 bottom-10 z-20 flex flex-col items-end pixel-font">
                    {/* painel de seções */}
                    {menuSecoesAberto && (
                        <div className="flex flex-col gap-2 max-h-96 overflow-y-auto max-w-80 p-2">
                            {secoesDaPagina.map((secao) => (
                                <button
                                    key={secao.index}
                                    onClick={() => irParaSecao(secao.index)}
                                    className="text-left flex gap-2 items-center text-md text-white hover:text-amber-400 bg-slate-950/80 hover:bg-slate-700/60 px-2 py-1 w-full truncate transition-colors"
                                    style={{ fontSize: 10, borderRadius: 3 }}
                                >
                                    <span>▶</span>
                                    <span>{secao.text}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* botão de toggle */}
                    <button
                        onClick={() => setMenuSecoesAberto((v) => !v)}
                        className="nes-btn is-primary "
                        style={{ fontSize: "9px", padding: "6px 12px" }}
                        title={menuSecoesAberto ? "Ocultar seções" : "Mostrar seções"}
                    >
                        {"SEÇÕES"}
                    </button>
                </div>
            )}
        </>
    );
}
