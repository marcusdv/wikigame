import Link from "next/link";

const BTN_STYLE = { height: 50, width: 125 } as const;

export default function BarraLogin() {
    return (
        <div className=" sticky pixel-font top-0 z-30 select-none \ bg-slate-900 border-b-4 border-amber-400 shadow-lg">
            {/* GRID */}
            <div className="grid grid-cols-6 divide-x-3 divide-slate-700 border-b-2 border-slate-700   mx-auto">
                <Link href="/diario" className="flex justify-center   py-2 ">
                    <button type="button" className="nes-btn is-primary" style={{ ...BTN_STYLE, fontSize: 8 }}>
                        Modo
                        <br />
                        Diário
                    </button>
                </Link>

                <Link href="" className=" flex justify-center  border-r-2 py-2 ">
                    <button
                        type="button"
                        className="nes-btn is-disabled "
                        style={{ ...BTN_STYLE, fontSize: 8 }}
                        disabled
                    >
                        Modo
                        <br />
                        Aleatório
                    </button>
                </Link>
                <Link href="" className="flex justify-center py-2 ">
                    <button
                        type="button"
                        className="nes-btn is-disabled"
                        style={{ ...BTN_STYLE, fontSize: 8 }}
                        disabled
                    >
                        Modo
                        <br />
                        Customizado
                    </button>
                </Link>
                <Link href="" className="flex justify-center py-2 ">
                    <button
                        type="button"
                        className="nes-btn is-disabled"
                        style={{ ...BTN_STYLE, fontSize: 8 }}
                        disabled
                    >
                        Recordes
                    </button>
                </Link>
                <Link href="" className="flex justify-center py-2 ">
                    <button
                        type="button"
                        className="nes-btn is-disabled"
                        style={{ ...BTN_STYLE, fontSize: 8 }}
                        disabled
                    >
                        Perfil
                    </button>
                </Link>
                <Link href="" className="flex justify-center py-2 ">
                    <button
                        type="button"
                        className="nes-btn is-disabled"
                        style={{ ...BTN_STYLE, fontSize: 8 }}
                        disabled
                    >
                        Desafios
                    </button>
                </Link>
            </div>
            <div
                className="border-b-2 border-slate-700 bg-slate-950 px-5 py-2.5 flex items-center gap-3 overflow-x-auto no-scrollbar pt-3  text-amber-300"
                style={{ fontSize: 8 }}
            >
                <span className="mx-auto">Faça sua conta e tenha acesso!</span>
            </div>
        </div>
    );
}
