"use client";

import { useEffect, useRef, useState, startTransition } from "react";

type WikiLink = {
    texto: string;
    href: string;
};

export default function LinkSelect({ wikiHtml }: { wikiHtml: string }) {
    const [links, setLinks] = useState<WikiLink[]>([]);
    const [busca, setBusca] = useState("");
    const [aberto, setAberto] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            const vistos = new Set<string>();

            const semDuplicata = Array.from(
                document.querySelectorAll<HTMLAnchorElement>("#wikicontent a[href^='/wiki/']"),
            )
                .filter((el) => {
                    const href = el.getAttribute("href")!;
                    if (vistos.has(href)) return false;
                    vistos.add(href);

                    const rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0) return false;

                    if (!el.checkVisibility()) return false;
                    if (el.querySelector("img")) return false;

                    return true;
                })
                .map((el) => ({
                    texto: el.textContent!.trim(),
                    href: el.getAttribute("href")!,
                }));

            startTransition(() => {
                setLinks(semDuplicata);
                setBusca("");
            });
        });

        return () => cancelAnimationFrame(raf);
    }, [wikiHtml]);

    // Fecha ao clicar fora do container
    useEffect(() => {
        if (!aberto) return;
        const fechar = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) {
                setAberto(false);
                setBusca("");
            }
        };
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, [aberto]);

    function toggleMenu() {
        setAberto((v) => {
            if (!v) requestAnimationFrame(() => inputRef.current?.focus());
            else setBusca("");
            return !v;
        });
    }

    const linksFiltrados = links.filter((link) => link.texto.toLowerCase().includes(busca.toLowerCase()));

    function handleClick(href: string) {
        setAberto(false);
        setBusca("");
        const el = document.querySelector<HTMLAnchorElement>(`#wikicontent a[href="${href}"]`);
        if (!el) return;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        setTimeout(() => {
            let piscadas = 0;
            const piscar = () => {
                el.style.setProperty("background-color", "#f54242", "important");
                el.style.setProperty("color", "#000", "important");
                setTimeout(() => {
                    el.style.removeProperty("background-color");
                    el.style.removeProperty("color");
                    piscadas++;
                    if (piscadas < 4) setTimeout(piscar, 150);
                }, 200);
            };
            piscar();
        }, 500);
    }

    if (links.length === 0) return null;

    return (
        <div ref={containerRef} className="fixed left-2 bottom-2 z-20 pixel-font">
            {/* Painel flutuante — aparece acima do botão */}
            {aberto && (
                <div className="absolute bottom-full mb-1 left-0 w-56 bg-slate-950/90 border border-slate-600 p-1 flex flex-col gap-1">
                    <input
                        ref={inputRef}
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar link..."
                        className="nes-input is-dark w-full"
                        style={{ fontSize: 8, padding: "4px 8px" }}
                    />
                    <div className="flex flex-col gap-0.5 max-h-64 overflow-y-auto overflow-x-hidden">
                        {linksFiltrados.length === 0 ? (
                            <span className="text-slate-500 px-2 py-1" style={{ fontSize: 8 }}>
                                Nenhum link encontrado
                            </span>
                        ) : (
                            linksFiltrados.map((link, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleClick(link.href)}
                                    className="text-left flex gap-2 items-center text-white hover:text-blue-400 hover:bg-slate-700/60 px-2 py-1 w-full truncate transition-colors"
                                    style={{ fontSize: 8.5 }}
                                    title={link.texto}
                                >
                                    <span className="shrink-0">▶</span>
                                    <span className="truncate">{link.texto}</span>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Botão compacto */}
            <button
                onClick={toggleMenu}
                className={`nes-btn ${aberto ? "" : "is-primary"}`}
                style={{ fontSize: 8, padding: "6px 12px" }}
                title={aberto ? "Fechar links" : "Buscar link"}
            >
                Links ({links.length})
            </button>
        </div>
    );
}