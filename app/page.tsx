"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUsuario } from "./lib/userContext";
import { supabase } from "./lib/supabase";
import { sortearJogo } from "./lib/sortearJogo";
import { arrPaginasIniciais } from "./dados/paginasIniciais";
import { arrPaginasObjetivo } from "./dados/paginasObjetivo";
import DarkModeToggle from "./components/DarkModeToggle";
import Footer from "./components/Footer";

// ==== SEED DO DIA NO FUSO DE BRASÍLIA ==== //
function seedDeHoje() {
    const d = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default function HomePage() {
    const { usuario, carregando, refreshUsuario } = useUsuario();
    const router = useRouter();
    const [desafio, setDesafio] = useState<{ inicial: string; objetivo: string } | null>(null);
    const [menuAberto, setMenuAberto] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
    const perfilRef = useRef<HTMLDivElement>(null);

    // ==== FECHA O MENU AO CLICAR FORA ==== //
    useEffect(() => {
        if (!menuAberto) return;
        const fechar = (e: MouseEvent) => {
            if (!perfilRef.current?.contains(e.target as Node)) setMenuAberto(false);
        };
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, [menuAberto]);

    // ==== LOGOUT ==== //
    async function handleLogout() {
        await fetch("/api/logout", { method: "POST" });
        await refreshUsuario();
        router.refresh();
    }

    // ==== BUSCA O DESAFIO DO DIA OU GERA LOCALMENTE PARA O PREVIEW ==== //
    useEffect(() => {
        const seed = seedDeHoje();
        async function buscar() {
            const { data } = await supabase
                .from("palavras_do_dia")
                .select("inicial, objetivo")
                .eq("data", seed)
                .maybeSingle();
            if (data) {
                setDesafio({ inicial: data.inicial, objetivo: data.objetivo });
            } else {
                const { start, target } = sortearJogo(arrPaginasIniciais, arrPaginasObjetivo, seed);
                setDesafio({ inicial: start, objetivo: target });
            }
        }
        buscar();
    }, []);

    return (
        <div className="min-h-screen flex flex-col pixel-font">
            {/* BARRA SUPERIOR */}
            <div className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b-4 border-amber-400 px-4 py-2 flex items-center justify-between shadow-sm">
                <span className="text-amber-600 dark:text-amber-400 text-[10px]">WikiRun</span>

                <div className="flex items-center gap-2">
                    {/* MENU CONTROLE */}
                    <div ref={perfilRef}>
                        <button
                            onClick={() => {
                                const rect = perfilRef.current?.getBoundingClientRect();
                                if (rect) setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
                                setMenuAberto((v) => !v);
                            }}
                            className="flex flex-col items-center px-3 py-1 bg-transparent border-none cursor-pointer"
                        >
                            <i className="snes-logo" style={{ display: "block" }}></i>
                            {usuario ? (
                                <span className="text-amber-600 dark:text-amber-400 text-[7px] mt-1">
                                    {usuario.nome}
                                </span>
                            ) : (
                                <span className="text-amber-600 dark:text-amber-400 text-[7px] mt-1">INSERT COIN</span>
                            )}
                        </button>

                        {menuAberto && (
                            <div
                                className="fixed bg-white dark:bg-slate-900 border-2 border-amber-400 shadow-lg z-50 min-w-28"
                                style={{ top: menuPos.top, right: menuPos.right }}
                            >
                                {[
                                    { href: "/", label: "Home" },
                                    { href: "/diario", label: "Desafio Diário" },
                                    { href: "/jogar", label: "Jogo Aleatório" },
                                    { href: "/recordes", label: "Recordes" },
                                    ...(usuario ? [{ href: "/perfil", label: "Perfil" }] : []),
                                ].map(({ href, label }) => (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setMenuAberto(false)}
                                        className="pixel-font block px-3 py-2 text-amber-600 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-[8px]"
                                    >
                                        {label}
                                    </Link>
                                ))}
                                <div className="border-t border-slate-200 dark:border-slate-700" />
                                <DarkModeToggle />
                                <div className="border-t border-slate-200 dark:border-slate-700" />
                                {usuario ? (
                                    <button
                                        onClick={handleLogout}
                                        className="pixel-font w-full text-left px-3 py-2 text-amber-600 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-[8px]"
                                    >
                                        Sair
                                    </button>
                                ) : (
                                    <Link
                                        href="/login"
                                        onClick={() => setMenuAberto(false)}
                                        className="pixel-font block px-3 py-2 text-amber-600 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700 text-[8px]"
                                    >
                                        Entrar
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CONTEÚDO HERO */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 ">
                <div className="w-full max-w-xl flex flex-col gap-8">
                    {/* TÍTULO E TAGLINE */}
                    <div className="text-center flex flex-col gap-4">
                        <h1 className="text-black dark:text-white text-2xl md:text-5xl">WikiRun</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-[9px] md:text-[11px] leading-relaxed">
                            Clique nos links dos artigos e chegue na página objetivo do dia da Wikipedia.
                        </p>
                    </div>

                    {/* DESAFIO DO DIA */}
                    {desafio && (
                        <div className="flex flex-col items-stretch  gap-2">
                            <div className="nes-container is-dark is-rounded text-center" style={{ padding: "1rem" }}>
                                <p className="text-slate-400 text-[7px] mb-4">★ DESAFIO DE HOJE ★</p>
                                <p className="text-white text-[10px] md:text-[13px] leading-relaxed">
                                    {desafio.inicial}
                                </p>
                                <p className="text-blue-400 text-[14px] my-2">↓</p>
                                <p className="text-white text-[10px] md:text-[13px] leading-relaxed">
                                    {desafio.objetivo}
                                </p>
                            </div>
                            <div className="mt-4 mx-auto">
                                <Link href="/diario" className="nes-btn is-primary text-[7px] md:text-[16px]">
                                    Jogar agora →
                                </Link>
                            </div>
                        </div>
                    )}

                    {/* COMO JOGAR — só para não logados */}
                    {!carregando && !usuario && (
                        <div
                            className="nes-container dark:bg-[#212529] dark:border-white"
                            style={{ padding: "1.25rem" }}
                        >
                            <p className="text-slate-500 dark:text-slate-400 text-[7px] text-center mb-4">COMO JOGAR</p>
                            <div className="flex flex-col gap-4">
                                <div className="flex items-start gap-3">
                                    <span className="text-yellow-500 dark:text-yellow-400 text-[10px] shrink-0">
                                        1.
                                    </span>
                                    <p className="text-slate-800 dark:text-white text-[8px] leading-relaxed">
                                        Você começa em uma página da Wikipedia
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-yellow-500 dark:text-yellow-400 text-[10px] shrink-0">
                                        2.
                                    </span>
                                    <p className="text-slate-800 dark:text-white text-[8px] leading-relaxed">
                                        Clique nos links dos artigos para navegar entre páginas
                                    </p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-yellow-500 dark:text-yellow-400 text-[10px] shrink-0">
                                        3.
                                    </span>
                                    <p className="text-slate-800 dark:text-white text-[8px] leading-relaxed">
                                        Chegue na página destino com o menor número de pontos
                                    </p>
                                </div>

                                {/* EXEMPLO VISUAL */}
                                <div className="border-t border-slate-200 dark:border-slate-600 pt-4 flex flex-col gap-2">
                                    <p className="text-slate-500 dark:text-slate-400 text-[6px] text-center mb-1">
                                        EXEMPLO
                                    </p>

                                    <div className="border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-3 py-2">
                                        <p className="text-[6px] text-slate-400 dark:text-slate-500 mb-1">INÍCIO</p>
                                        <p className="text-slate-900 dark:text-white text-[8px]">Amazônia</p>
                                        <p className="text-[7px] text-slate-500 dark:text-slate-400 mt-1">
                                            ...cobre grande parte da{" "}
                                            <span className="text-blue-600 dark:text-blue-400 underline">
                                                floresta tropical
                                            </span>{" "}
                                            🖱️...
                                        </p>
                                    </div>

                                    <p className="text-center text-slate-400 dark:text-slate-500 text-[7px]">
                                        ↓ clicou em &quot;floresta tropical&quot;
                                    </p>

                                    <div className="border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-3 py-2">
                                        <p className="text-slate-900 dark:text-white text-[8px]">Floresta Tropical</p>
                                        <p className="text-[7px] text-slate-500 dark:text-slate-400 mt-1">
                                            ...abriga milhares de espécies de{" "}
                                            <span className="text-blue-600 dark:text-blue-400 underline">árvores</span>{" "}
                                            🖱️...
                                        </p>
                                    </div>

                                    <p className="text-center text-slate-400 dark:text-slate-500 text-[7px]">
                                        ↓ clicou em &quot;árvores&quot;
                                    </p>

                                    <div className="border-2 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-3 py-2">
                                        <p className="text-slate-900 dark:text-white text-[8px]">Árvore</p>
                                        <p className="text-[7px] text-slate-500 dark:text-slate-400 mt-1">
                                            ...sua estrutura é composta principalmente de{" "}
                                            <span className="text-blue-600 dark:text-blue-400 underline">madeira</span>{" "}
                                            🖱️...
                                        </p>
                                    </div>

                                    <p className="text-center text-slate-400 dark:text-slate-500 text-[7px]">
                                        ↓ clicou em &quot;madeira&quot;
                                    </p>

                                    <div className="border-2 border-green-400 dark:border-green-500 bg-green-50 dark:bg-green-950 px-3 py-2">
                                        <p className="text-[6px] text-green-600 dark:text-green-400 mb-1">DESTINO ✓</p>
                                        <p className="text-slate-900 dark:text-white text-[8px]">Madeira</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BOTÕES */}
                    {!carregando && (
                        <div className="flex flex-col items-center gap-4">
                            {usuario ? (
                                <>
                                    <Link href="/diario" className="nes-btn is-primary text-[8px] md:text-[10px]">
                                        Desafio Diário
                                    </Link>
                                    <Link href="/jogar" className="nes-btn text-[8px] md:text-[10px]">
                                        Jogo Aleatório
                                    </Link>
                                </>
                            ) : (
                                <Link href="/diario" className="nes-btn text-[7px] md:text-[16px]">
                                    Jogar sem conta
                                </Link>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <Footer historico={[]} pontos={0} />
        </div>
    );
}
