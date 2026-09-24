"use client";

import Image from "next/image";
import Link from "next/link";

// ==== SEED DO DIA NO FUSO DE BRASÍLIA ==== //
function seedDeHoje() {
    const d = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default function HomePage() {
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

    return (
        <div className="min-h-screen flex flex-col pixel-font">
            {/* CONTEÚDO HERO */}
            <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 ">
                <div className="w-full max-w-xl flex flex-col gap-8">
                    {/* TÍTULO E TAGLINE */}
                    <div className="text-center flex flex-col gap-4">
                        <div className="bg-amber-100 w-fit rounded-full mx-auto">
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
                            Chegue na página objetivo da Wikipédia <br /> no menor número de cliques possível.
                        </p>
                    </div>
                    {/* BOTÕES */}
                    <div className="flex gap-4 px-20 text-lg flex-col sm:flex-row justify-center items-center">
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
                    </div>
                </div>
            </div>
        </div>
    );
}
