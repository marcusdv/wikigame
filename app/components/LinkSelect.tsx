"use client";

import { useEffect, useRef, useState, startTransition } from "react";

// `index`: posição do título em secoesRef (-1 = topo da página).
type ItemSecao = { type: "secao"; text: string; index: number };
// `indice`: posição do link em linksRef (o próprio elemento <a> encontrado no artigo).
type ItemLink = { type: "link"; texto: string; href: string; indice: number };
type ListItem = ItemSecao | ItemLink;

// ==== CONFIGURAÇÃO DA ROLAGEM ATÉ O LINK ====
const INTERVALO_CHECAGEM_MS = 100; // de quanto em quanto tempo confere se a rolagem parou
const CHECAGENS_PARADA = 2; // quantas checagens seguidas sem mexer = "parou" (~200 ms)
const MAX_CORRECOES = 3; // quantas vezes corrige a posição se a página mudou de tamanho no caminho
const LIMITE_ROLAGEM_MS = 5000; // segurança: nunca fica conferindo por mais que isso
const MARGEM_VISIVEL = 0.1; // o link precisa estar entre 10% e 90% da altura da tela (fora da barra fixa)

export default function LinkSelect({ wikiHtml, titulo }: { wikiHtml: string; titulo: string }) {
    const [items, setItems] = useState<ListItem[]>([]);
    const [busca, setBusca] = useState("");
    const [aberto, setAberto] = useState(false);
    const [clicado, setClicado] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listaRef = useRef<HTMLDivElement>(null);
    const savedScroll = useRef<number>(0);

    // Os ELEMENTOS encontrados no artigo, na mesma ordem da lista. O clique usa o próprio elemento,
    // em vez de procurar de novo com querySelector (que podia achar outro elemento, ou o título errado
    // quando havia títulos escondidos antes).
    const linksRef = useRef<HTMLAnchorElement[]>([]);
    const secoesRef = useRef<HTMLHeadingElement[]>([]);

    // Função que cancela a rolagem/piscada em andamento (null = nada em andamento).
    // Um clique novo, a troca de artigo ou o componente sair da tela cancelam o que estava rodando.
    const cancelarAnimacaoRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        // Artigo novo: para qualquer rolagem/piscada do artigo anterior.
        cancelarAnimacaoRef.current?.();

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
                // checkVisibility() só existe a partir do Safari 17.4 — em iPhones antigos
                // presos numa versão anterior do iOS, chamar direto lança TypeError e quebra
                // o useEffect inteiro (o componente nunca chega a renderizar). offsetParent
                // é suportado universalmente e cobre o caso comum de display:none num ancestral.
                const visivel =
                    typeof el.checkVisibility === "function" ? el.checkVisibility() : el.offsetParent !== null;
                if (!visivel) return false;
                if (el.querySelector("img")) return false;
                return true;
            });

            // Intercala seções e links pela ordem do DOM
            const lista: ListItem[] = [];
            if (titulo) lista.push({ type: "secao", text: titulo, index: -1 });
            let h2Idx = 0;

            allLinks.forEach((linkEl, indice) => {
                // Insere cabeçalhos de todas as h2s que vêm antes deste link
                while (
                    h2Idx < h2s.length &&
                    h2s[h2Idx].compareDocumentPosition(linkEl) & Node.DOCUMENT_POSITION_FOLLOWING
                ) {
                    lista.push({ type: "secao", text: h2s[h2Idx].textContent?.trim() ?? "", index: h2Idx });
                    h2Idx++;
                }
                lista.push({
                    type: "link",
                    texto: linkEl.textContent!.trim(),
                    href: linkEl.getAttribute("href")!,
                    indice,
                });
            });

            // Guarda os elementos: `index` das seções e `indice` dos links apontam para estas listas.
            linksRef.current = allLinks;
            secoesRef.current = h2s;

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

    // Ao sair da tela, cancela rolagem/piscada em andamento (não deixa timers soltos).
    useEffect(() => {
        return () => cancelarAnimacaoRef.current?.();
    }, []);

    // ==== ROLA ATÉ UM ELEMENTO E CONFERE SE CHEGOU ====
    //
    // POR QUE NÃO BASTA UM scrollIntoView:
    // a rolagem suave calcula o destino UMA vez, no começo. Enquanto desliza, as imagens do artigo
    // carregam e empurram o conteúdo, e a rolagem termina onde o link ESTAVA (às vezes "para antes").
    //
    // COMO FUNCIONA:
    // 1. começa a rolagem suave até o elemento (centralizado);
    // 2. a cada 100 ms confere se a página parou de rolar;
    // 3. parou: o elemento está na área visível? Sim → chegou (chama `aoChegar`).
    //    Não (a página mudou no caminho) → corrige a posição na hora e confere de novo (até 3 vezes);
    // 4. se a pessoa rolar a página no meio (roda, dedo, teclado), para de corrigir e não briga com ela.
    function rolarAte(el: HTMLElement, aoChegar?: () => void) {
        cancelarAnimacaoRef.current?.(); // cancela a rolagem/piscada anterior

        let correcoes = 0;
        let ultimoY = -1;
        let checagensParado = 0;
        let encerrado = false;

        // O elemento está entre 10% e 90% da altura da tela?
        const estaVisivel = () => {
            const r = el.getBoundingClientRect();
            const margem = window.innerHeight * MARGEM_VISIVEL;
            return r.top >= margem && r.bottom <= window.innerHeight - margem;
        };

        const encerrar = () => {
            if (encerrado) return;
            encerrado = true;
            clearInterval(intervalo);
            clearTimeout(limite);
            window.removeEventListener("wheel", interrompidoPelaPessoa);
            window.removeEventListener("touchstart", interrompidoPelaPessoa);
            window.removeEventListener("keydown", interrompidoPelaPessoa);
            if (cancelarAnimacaoRef.current === encerrar) cancelarAnimacaoRef.current = null;
        };

        const chegou = () => {
            if (encerrado) return;
            encerrar();
            aoChegar?.();
        };

        // A pessoa rolou por conta própria: só para de corrigir (sem piscar).
        const interrompidoPelaPessoa = () => encerrar();

        // 1. rolagem suave inicial
        el.scrollIntoView({ behavior: "smooth", block: "center" });

        // 2 e 3. confere de tempos em tempos se parou e se chegou
        const intervalo = setInterval(() => {
            const y = window.scrollY;
            checagensParado = y === ultimoY ? checagensParado + 1 : 0;
            ultimoY = y;
            if (checagensParado < CHECAGENS_PARADA) return; // ainda rolando

            if (!estaVisivel() && correcoes < MAX_CORRECOES) {
                // A página mudou de tamanho no caminho: corrige na hora (sem animação) e confere de novo.
                correcoes++;
                checagensParado = 0;
                el.scrollIntoView({ behavior: "auto", block: "center" });
                return;
            }
            // Visível (ou já corrigiu o máximo: perto do fim da página não dá para centralizar).
            chegou();
        }, INTERVALO_CHECAGEM_MS);

        // Segurança: nunca fica conferindo para sempre.
        const limite = setTimeout(chegou, LIMITE_ROLAGEM_MS);

        // 4. a pessoa assumiu a rolagem
        window.addEventListener("wheel", interrompidoPelaPessoa, { passive: true });
        window.addEventListener("touchstart", interrompidoPelaPessoa, { passive: true });
        window.addEventListener("keydown", interrompidoPelaPessoa);

        cancelarAnimacaoRef.current = encerrar;
    }

    // ==== FAZ O LINK PISCAR (4 vezes, em vermelho) ====
    // Só é chamado quando o link já está na tela. Guarda os timers para poder cancelar no meio
    // (clique em outro link) sem deixar o link "preso" em vermelho.
    function piscar(el: HTMLElement) {
        const timers: ReturnType<typeof setTimeout>[] = [];
        let piscadas = 0;

        const apagar = () => {
            el.style.removeProperty("background-color");
            el.style.removeProperty("color");
        };

        const acender = () => {
            el.style.setProperty("background-color", "#f54242", "important");
            el.style.setProperty("color", "#000", "important");
            timers.push(
                setTimeout(() => {
                    apagar();
                    piscadas++;
                    if (piscadas < 4) timers.push(setTimeout(acender, 150));
                }, 200),
            );
        };

        const cancelar = () => {
            timers.forEach(clearTimeout);
            apagar();
            if (cancelarAnimacaoRef.current === cancelar) cancelarAnimacaoRef.current = null;
        };

        cancelarAnimacaoRef.current = cancelar;
        acender();
    }

    function irParaSecao(index: number) {
        if (index === -1) {
            cancelarAnimacaoRef.current?.();
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        // Usa o título guardado (o mesmo da lista), não procura de novo entre todos os h2.
        const titulo = secoesRef.current[index];
        if (titulo) rolarAte(titulo);
    }

    function handleClick(item: ItemLink) {
        setClicado(item.href);
        fecharMenu();
        // Usa o próprio elemento guardado; se o artigo mudou e ele não está mais na página, ignora.
        const el = linksRef.current[item.indice];
        if (!el || !el.isConnected) return;
        // Só pisca depois que o link chegou de fato na tela.
        rolarAte(el, () => piscar(el));
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
                                        onClick={() => handleClick(item)}
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
                    <input
                        ref={inputRef}
                        type="text"
                        value={busca}
                        onChange={(e) => setBusca(e.target.value)}
                        placeholder="Buscar link..."
                        className="nes-input is-dark"
                        style={{ fontSize: 8, maxWidth: "95%" }}
                    />
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
