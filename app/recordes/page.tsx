"use client";

import { useRouter } from "next/navigation";

export default function Recordes() {
    const router = useRouter();
    return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4 pixel-font text-center px-4">
            <i className="nes-icon wrench is-large"></i>
            <h1 className="text-xl text-amber-300"> EM CONSTRUÇÃO</h1>
            <p className="text-slate-400" style={{ fontSize: 10 }}>
                Esta página ainda está sendo construída.
                <br />
                Volte em breve!
            </p>
            <span className="text-3xl">🚧</span>
            <button onClick={() => router.push("/diario")} className="nes-btn" style={{ fontSize: 8 }}>
                Voltar
            </button>
        </div>
    );
}
