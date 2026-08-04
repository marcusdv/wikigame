"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { supabase } from "./lib/supabase";
import { sortearJogo } from "./lib/sortearJogo";
import { arrPaginasIniciais } from "./dados/paginasIniciais";
import { arrPaginasObjetivo } from "./dados/paginasObjetivo";
import Footer from "./components/Footer";
import Image from "next/image";

// ==== SEED DO DIA NO FUSO DE BRASÍLIA ==== //
function seedDeHoje() {
    const d = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default function HomePage() {
    const [desafio, setDesafio] = useState<{ inicial: string; objetivo: string } | null>(null);

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

                    <div className="flex flex-col items-stretch  gap-2">
                        <div className="nes-container is-dark is-rounded text-center" style={{ padding: "1rem" }}>
                            <p className="text-slate-400 text-[7px] mb-4">★ DESAFIO DE HOJE ★</p>
                            {/* DESAFIO DO DIA */}
                            {desafio && (
                                <>
                                    <p className="text-white text-[10px] md:text-[13px] leading-relaxed">
                                        {desafio.inicial}
                                    </p>
                                    <p className="text-blue-400 text-[14px] my-2">↓</p>
                                    <p className="text-white text-[10px] md:text-[13px] leading-relaxed">
                                        {desafio.objetivo}
                                    </p>
                                </>
                            )}
                        </div>
                        <div className="mt-4 mx-auto">
                            <Link href="/diario" className="nes-btn is-primary text-[24px] md:text-[24px]">
                                JOGAR!!
                            </Link>
                        </div>
                    </div>

                    {/* COMO JOGAR — só para não logados */}
                    <div className="nes-container  flex flex-col text-[12px] dark:bg-[#212529] dark:border-white">
                        {/* TITULO COMO JOGAR */}
                        <p className="text-slate-500 dark:text-slate-400 text-[7px] text-center mb-4">COMO JOGAR</p>

                        {/* IMAGENS */}
                        <div className="grid col-span-3 mx-auto gap-4" style={{ maxWidth: "380px" }}>
                            <figure className="flex flex-col ">
                                <figcaption>
                                    <p className="text-slate-800 dark:text-white leading-relaxed">
                                        <span className="text-yellow-500 dark:text-yellow-400 text-[10px] shrink-0">
                                            1.{" "}
                                        </span>
                                        Você começa em uma página da Wikipedia e precisa chegar em outra. <br /> <br />
                                        <span>
                                            Exemplo: <span className="text-blue-400">Brasil</span> <br />
                                            Objetivo: <span className="text-blue-400">Vincent van Gogh</span>
                                        </span>
                                    </p>
                                </figcaption>
                                <Image
                                    className="m-auto"
                                    src="/tutorialImagens/tuto_1.png"
                                    width={380}
                                    height={680}
                                    alt="Exemplo de como jogar"
                                />
                            </figure>

                            <figure className="flex flex-col">
                                <figcaption>
                                    <p className="text-slate-800 dark:text-white leading-relaxed">
                                        <span className="text-yellow-500 dark:text-yellow-40e shrink-0">2. </span>
                                        Clique nos links para a página que você acha que vai te levar mais perto do
                                        objetivo.
                                        <span className="text-blue-400">
                                            Clicando em artistas para tentar encontrar Vincent van Gogh
                                        </span>
                                    </p>
                                </figcaption>
                                <Image
                                    className="m-auto"
                                    src="/tutorialImagens/tuto_2.png"
                                    width={380}
                                    height={669}
                                    alt="Exemplo de como jogar"
                                />
                            </figure>
                            <figure className="flex flex-col">
                                <figcaption>
                                    <p className="text-slate-800 dark:text-white leading-relaxed">
                                        <span className="text-yellow-500 dark:text-yellow-400 text-[10px] shrink-0">
                                            3.{" "}
                                        </span>
                                        Que Sorte! Alí está o link para a página objetivo.
                                    </p>
                                </figcaption>
                                <Image
                                    className="m-auto"
                                    src="/tutorialImagens/tuto_3.png"
                                    width={380}
                                    height={669}
                                    alt="Exemplo de como jogar"
                                />
                            </figure>
                            <figure className="flex flex-col">
                                <figcaption>
                                    <p className="text-slate-800 dark:text-white leading-relaxed">
                                        <span className="text-yellow-500 dark:text-yellow-400 text-[10px] shrink-0">
                                            4.{" "}
                                        </span>
                                        BOA! E quantos menos cliques, melhor você ficará no ranking dos jogadores!
                                    </p>
                                </figcaption>

                                <Image
                                    className="m-auto"
                                    src="/tutorialImagens/tuto_4.png"
                                    width={380}
                                    height={669}
                                    alt="Exemplo de como jogar"
                                />
                            </figure>
                        </div>
                    </div>

                    {/* BOTÕES */}
                    <div className="flex flex-col items-center gap-4">
                        <>
                            <Link href="/diario" className="nes-btn is-primary text-[24px] md:text-[24px]">
                                JOGAR!!
                            </Link>
                        </>
                    </div>
                </div>
            </div>
            <Footer historico={[]} pontos={0} />
        </div>
    );
}
