"use client";

import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

type RecordeBruto = {
    id: number;
    pontos: number;
    usuarios: { nome: string };
};

type Recorde = {
    id: number;
    pontos: number;
    nome_usuario: string;
};

// ==== DATA DE HOJE NO FUSO DE BRASÍLIA (UTC-3), FORMATO "YYYY-MM-DD" ==== //
function dataDeHoje() {
    const d = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default function Recordes() {
    const [recordes, setRecordes] = useState<Recorde[]>([]);
    const [palavrasDoJogo, setPalavrasDoJogo] = useState<{ inicial: string; objetivo: string }>({
        inicial: "",
        objetivo: "",
    });
    const [carregando, setCarregando] = useState(true);
    const [dataSelecionada, setDataSelecionada] = useState(dataDeHoje);

    // ==== AVANÇA OU RETROCEDE A DATA SELECIONADA EM 1 DIA ==== //
    function mudarDia(dias: number) {
        const base = new Date(dataSelecionada + "T12:00:00");
        base.setDate(base.getDate() + dias);
        setDataSelecionada(base.toISOString().split("T")[0]);
    }

    // ==== BUSCA RECORDES SEMPRE QUE A DATA MUDA ==== //
    useEffect(() => {
        async function buscar() {
            setCarregando(true);
            // 1. busca a palavra do dia para a data selecionada
            const { data: palavra } = await supabase
                .from("palavras_do_dia")
                .select("id, inicial, objetivo")
                .eq("data", dataSelecionada)
                .maybeSingle();

            if (!palavra) {
                setPalavrasDoJogo({ inicial: "", objetivo: "" });
                setRecordes([]);
                setCarregando(false);
                return;
            }

            setPalavrasDoJogo({ inicial: palavra.inicial, objetivo: palavra.objetivo });

            // 2. busca os recordes daquela palavra do dia, com nome do usuário via JOIN
            const { data, error } = await supabase
                .from("recordes")
                .select("id, pontos, usuarios!id_usuario(nome)")
                .eq("id_palavra_do_dia", palavra.id)
                .order("pontos", { ascending: true })
                .limit(100);

            if (error) console.error("Erro ao buscar recordes:", error);

            if (data) {
                const typed = data as unknown as RecordeBruto[];
                setRecordes(
                    typed.map((r) => ({
                        id: r.id,
                        pontos: r.pontos,
                        nome_usuario: r.usuarios?.nome ?? "?",
                    })),
                );
            }

            setCarregando(false);
        }

        buscar();
    }, [dataSelecionada]);

    const medalha = ["🥇", "🥈", "🥉"];

    return (
        <div className="min-h-screen flex flex-col items-center px-3 py-6 md:px-4 md:py-8 pixel-font">
            <div className="w-full md:max-w-[60%] flex flex-col gap-4 md:gap-6">
                {/* TÍTULO */}
                <div className="flex items-center justify-between">
                    <Link href="/jogar" className="nes-btn text-[7px] md:text-[8px]">
                        ← Jogar
                    </Link>
                    <h1 className="text-center text-white text-[12px] md:text-lg">
                        <i className="nes-icon trophy is-small mr-2"></i>
                        Recordes
                    </h1>
                    <div className="invisible nes-btn text-[7px]">←</div>
                </div>

                {/* CALENDÁRIO COM SETAS DE NAVEGAÇÃO */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-1 md:gap-2">
                        <button className="nes-btn text-[8px] md:text-[10px]" onClick={() => mudarDia(-1)}>◀</button>
                        {/* wrapper flex-1 isola o width:100% do nes-input ao seu próprio espaço */}
                        <div className="flex-1 min-w-0">
                            <input
                                type="date"
                                className="nes-input is-dark"
                                style={{ fontSize: 8 }}
                                value={dataSelecionada}
                                onChange={(e) => setDataSelecionada(e.target.value)}
                            />
                        </div>
                        <button className="nes-btn text-[8px] md:text-[10px]" onClick={() => mudarDia(1)}>▶</button>
                    </div>
                    <div className="flex justify-center">
                        <button className="nes-btn is-primary text-[7px] md:text-[8px]" onClick={() => setDataSelecionada(dataDeHoje())}>
                            Hoje
                        </button>
                    </div>
                </div>

                {carregando ? (
                    <p className="text-slate-400 text-center text-[8px] md:text-[10px]">Carregando...</p>
                ) : (
                    <>
                        {/* DESAFIO DO DIA */}
                        {palavrasDoJogo.inicial ? (
                            <div
                                className="nes-container is-dark is-rounded text-center"
                                style={{ padding: "0.75rem", borderColor: "#334155" }}
                            >
                                <span className="text-slate-400 text-[6px] md:text-[8px]">DESAFIO DO DIA</span>
                                <p className="text-white mt-2 text-[10px] md:text-[14px]">{palavrasDoJogo.inicial}</p>
                                <p className="text-blue-400 text-[10px] md:text-[12px]">↓</p>
                                <p className="text-white text-[10px] md:text-[14px]">{palavrasDoJogo.objetivo}</p>
                            </div>
                        ) : (
                            <div className="nes-container is-dark is-rounded text-center" style={{ padding: "0.75rem" }}>
                                <p className="text-slate-500 text-[8px] md:text-[9px]">
                                    Nenhum desafio registrado nessa data.
                                </p>
                            </div>
                        )}

                        {/* SCOREBOARD */}
                        {recordes.length > 0 && (
                            <div className="relative overflow-hidden">
                                <table className="nes-table is-bordered is-dark w-full text-[8px] md:text-[12px]">
                                    <thead>
                                        <tr>
                                            <th>#</th>
                                            <th>Jogador</th>
                                            <th>Pontos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recordes.map((recorde, idx) => (
                                            <tr key={recorde.id}>
                                                <td>{medalha[idx] ?? idx + 1}</td>
                                                <td
                                                    className={
                                                        idx === 0
                                                            ? "text-yellow-400"
                                                            : idx === 1
                                                              ? "text-slate-300"
                                                              : idx === 2
                                                                ? "text-amber-600"
                                                                : ""
                                                    }
                                                >
                                                    {recorde.nome_usuario}
                                                </td>
                                                <td>{recorde.pontos}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
