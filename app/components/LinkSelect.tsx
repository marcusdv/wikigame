"use client";

import { useEffect, useRef, useState, startTransition } from "react";

type ItemSecao = { type: "secao"; text: string; index: number };
type ItemLink = { type: "link"; texto: string; href: string };
type ListItem = ItemSecao | ItemLink;

export default function LinkSelect({ wikiHtml, titulo }: { wikiHtml: string; titulo: string }) {
    const [items, setItems] = useState<ListItem[]>([]);
    const [busca, setBusca] = useState("");
    const [aberto, setAberto] = useState(false);
    const [clicado, setClicado] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listaRef = useRef<HTMLDivElement>(null);
    const savedScroll = useRef<number>(0);

    useEffect(() => {
        const raf = requestAnimationFrame(() => {
            // Seções visíveis (h2s não ocultos pelo CSS)
            const h2s = Array.from(document.querySelectorAll<HTMLHeadingElement>("#wikicontent h2")).filter((h2) => {
                const pai = h2.closest(".mw-heading");
                return !pai || getComputedStyle(pai).display !== "none";
            });

            // Links válidos em ordem do DOM
            const vistos = new Set<string>();
            const allLinks = Array.from(
                document.querySelectorAll<HTMLAnchorElement>("#wikicontent a[href^='/wiki/']"),
            ).filter((el) => {
                const href = el.getAttribute("href")!;
                if (vistos.has(href)) return false;
                vistos.add(href);
                const rect = el.getBoundingClientRect();
                if (rect.width === 0 || rect.height === 0) return false;
                if (!el.checkVisibility()) return false;
                if (el.querySelector("img")) return false;
                return true;
            });

            // Intercala seções e links pela ordem do DOM
            const lista: ListItem[] = [];
            if (titulo) lista.push({ type: "secao", text: titulo, index: -1 });
            let h2Idx = 0;

            for (const linkEl of allLinks) {
                // Insere cabeçalhos de todas as h2s que vêm antes deste link
                while (
                    h2Idx < h2s.length &&
                    h2s[h2Idx].compareDocumentPosition(linkEl) & Node.DOCUMENT_POSITION_FOLLOWING
                ) {
                    lista.push({ type: "secao", text: h2s[h2Idx].textContent?.trim() ?? "", index: h2Idx });
                    h2Idx++;
                }
                lista.push({ type: "link", texto: linkEl.textContent!.trim(), href: linkEl.getAttribute("href")! });
            }

            startTransition(() => {
                setItems(lista);
                setBusca("");
                setClicado(null);
            });
        });

        return () => cancelAnimationFrame(raf);
    }, [wikiHtml, titulo]);

    // Restaura scroll ao abrir — reseta quando muda de artigo
    useEffect(() => {
        if (aberto) {
            requestAnimationFrame(() => {
                if (listaRef.current) listaRef.current.scrollTop = savedScroll.current;
            });
        }
    }, [aberto]);

    useEffect(() => {
        savedScroll.current = 0;
    }, [wikiHtml]);

    // Salva scroll e fecha — precisa ser síncrono antes do div desmontar
    function fecharMenu() {
        if (listaRef.current) savedScroll.current = listaRef.current.scrollTop;
        setAberto(false);
        setBusca("");
    }

    // Fecha ao clicar fora
    useEffect(() => {
        if (!aberto) return;
        const fechar = (e: MouseEvent) => {
            if (!containerRef.current?.contains(e.target as Node)) fecharMenu();
        };
        document.addEventListener("mousedown", fechar);
        return () => document.removeEventListener("mousedown", fechar);
    }, [aberto]);

    function toggleMenu() {
        if (aberto) fecharMenu();
        else setAberto(true);
    }

    function irParaSecao(index: number) {
        if (index === -1) {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        const h2s = document.querySelectorAll("#wikicontent h2");
        h2s[index]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    function handleClick(href: string) {
        setClicado(href);
        fecharMenu();
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

    const totalLinks = items.filter((i) => i.type === "link").length;
    if (totalLinks === 0) return null;

    // Com busca: mostra só links que batem (flat, sem cabeçalhos)
    // Sem busca: mostra lista completa com seções intercaladas
    const listaVisivel: ListItem[] = busca
        ? items.filter((i): i is ItemLink => i.type === "link" && i.texto.toLowerCase().includes(busca.toLowerCase()))
        : items;

    return (
        <div ref={containerRef} className="fixed right-2 bottom-2 z-20 pixel-font">
            {/* Painel flutuante */}
            {aberto && (
                <div className="absolute bottom-full mb-2 right-0 w-75 bg-slate-950/90 border border-slate-600 p-2 flex flex-col gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar link..."
                        className="nes-input is-dark"
                        style={{ fontSize: 8, maxWidth: "95%" }}
                    />
                    <div
                        ref={listaRef}
                        className="flex flex-col max-h-75 overflow-y-auto overflow-x-hidden overscroll-contain"
                    >
                        {listaVisivel.length === 0 ? (
                            <span className="text-slate-500 px-2 py-1" style={{ fontSize: 8 }}>
                                Nenhum link encontrado
                            </span>
                        ) : (
                            listaVisivel.map((item, i) =>
                                item.type === "secao" ? (
                                    // Cabeçalho de seção — caixa separadora, clicável para rolar até ela
                                    <button
                                        key={`s-${i}`}
                                        onClick={() => irParaSecao(item.index)}
                                        className="text-left flex items-center gap-1 px-2 py-1 w-full truncate tracking-widest text-amber-400 bg-slate-800 border-y border-slate-600 hover:bg-slate-700 transition-colors mt-1 first:mt-0"
                                        style={{ fontSize: 8, textTransform: "uppercase" }}
                                        title={item.text}
                                    >
                                        <span className="mr-1" style={{ textTransform: "none" }}>
                                            •
                                        </span>
                                        {item.text}
                                    </button>
                                ) : (
                                    // Item de link normal
                                    <button
                                        key={`l-${i}`}
                                        onClick={() => handleClick(item.href)}
                                        className={`text-left flex gap-2 items-center px-2 py-1.5 w-full truncate transition-colors hover:bg-slate-700/60 border-b border-slate-700/40 ${
                                            clicado === item.href
                                                ? "bg-blue-600/40 text-blue-300"
                                                : "text-white hover:text-blue-400"
                                        }`}
                                        style={{ fontSize: 8.5 }}
                                        title={item.texto}
                                    >
                                        <span className="shrink-0">-</span>
                                        <span className="truncate">{item.texto}</span>
                                    </button>
                                ),
                            )
                        )}
                    </div>
                </div>
            )}

            {/* Botão compacto */}
            <button
                onClick={toggleMenu}
                className={`nes-btn ${aberto ? "" : "is-primary"}`}
                style={{ fontSize: 8, padding: "6px 12px" }}
                title={aberto ? "Fechar" : "Links e seções"}
            >
                Links ({totalLinks})
            </button>
        </div>
    );
}
