"use client";

import Image from "next/image";
import Link from "next/link";
import { supabase } from "./lib/supabase";
import { useEffect, useState } from "react";

// ==== SEED DO DIA NO FUSO DE BRASÍLIA ==== //
function seedDeHoje() {
    const d = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default function HomePage() {
    const [numeroDaPalavra, setNumeroDaPalavra] = useState<number | null>(null);
    const [carregando, setCarregando] = useState(true);

    // Formata a data com o mês por extenso (ex: 24 de setembro de 2026)
    const meses = [
        "janeiro",
        "fevereiro",
        "março",
        "abril",
        "maio",
        "junho",
        "julho",
        "agosto",
        "setembro",
        "outubro",
        "novembro",
        "dezembro",
    ];

    const hoje = new Date();
    const dia = hoje.getDate();
    const mes = meses[hoje.getMonth()];
    const ano = hoje.getFullYear();

    const dataHoje = `${dia} de ${mes} de ${ano}`;

    // QUAL O NÚMERO DESSE JOGO
    useEffect(() => {
        async function totaisDeJogos() {
            const { count, error } = await supabase.from("palavras_do_dia").select("*", { count: "exact", head: true });

            if (error) {
                console.error("Erro ao buscar total de jogos:", error);
                setCarregando(false);
                return;
            }

            if (count) {
                setNumeroDaPalavra(count);
            }

            setCarregando(false);
        }

        totaisDeJogos();
    }, []); // array vazio: roda só uma vez, ao montar o componente

    // ENQUANTO OS DADOS NÃO CHEGAM, MOSTRA UMA RODINHA DE LOADING (EVITA O FLICKER)
    if (carregando) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-black dark:border-t-white rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col pixel-font">
            {/* CONTEÚDO HERO */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 ">
                <div className="w-full max-w-xl flex flex-col gap-8">
                    {/* TÍTULO E TAGLINE */}
                    <div className="text-center flex flex-col gap-4">
                        <div className="relative bg-amber-100 w-fit rounded-full mx-auto">
                            <Image
                                src="/wikirun.png"
                                alt="Logo do WikiRun"
                                width={150}
                                height={150}
                                className="mx-auto"
                            />
                        </div>
                        <h1 className="text-black dark:text-white text-2xl md:text-5xl">WikiRun</h1>
                        <p className="text-black dark:text-white text-[9px] md:text-[11px] leading-relaxed">
                            Chegue na página objetivo <br /> no menor número de cliques possível.
                        </p>
                    </div>
                    {/* BOTÕES */}
                    <div className="flex gap-4 px-8 md:px-20 md:text-lg text-sm flex-row justify-center items-center">
                        <Link href="/login" className="nes-btn is-success w-full">
                            Login
                        </Link>
                        <Link href="/diario" className="nes-btn is-primary w-full mb-2">
                            Jogar
                        </Link>
                    </div>

                    {/* INFORMAÇÃO E DEVELOPER */}
                    <div className="mx-auto text-[8px] text-center text-black dark:text-white  leading-relaxed">
                        <p>{dataHoje}</p>
                        <p>Jogo Número {numeroDaPalavra}º</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
