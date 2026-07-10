"use client";

import { supabase } from "../lib/supabase";
import { useEffect, useState } from "react";

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
        <div className="min-h-screen flex flex-col items-center px-4 py-8 pixel-font">
            <div className="w-full max-w-[60%] flex flex-col gap-6">
                {/* título */}
                <h1 className="text-center text-white text-lg">
                    <i className="nes-icon trophy is-small mr-2"></i>
                    Recordes
                </h1>

                {/* CALENDÁRIO COM SETAS DE NAVEGAÇÃO */}
                <div className="flex items-center gap-2">
                    <button className="nes-btn" style={{ fontSize: 10 }} onClick={() => mudarDia(-1)}>
                        ◀
                    </button>
                    {/* wrapper flex-1 isola o width:100% do nes-input ao seu próprio espaço */}
                    <div className="flex-1 min-w-0">
                        <input
                            type="date"
                            className="nes-input is-dark"
                            style={{ fontSize: 18 }}
                            value={dataSelecionada}
                            onChange={(e) => setDataSelecionada(e.target.value)}
                        />
                    </div>
                    <button className="nes-btn" style={{ fontSize: 10 }} onClick={() => mudarDia(1)}>
                        ▶
                    </button>
                    <button
                        className="nes-btn is-primary"
                        style={{ fontSize: 8 }}
                        onClick={() => setDataSelecionada(dataDeHoje())}
                    >
                        Hoje
                    </button>
                </div>

                {carregando ? (
                    <p className="text-slate-400 text-center" style={{ fontSize: 10 }}>
                        Carregando...
                    </p>
                ) : (
                    <>
                        {/* par de páginas do jogo */}
                        {palavrasDoJogo.inicial ? (
                            <div
                                className="nes-container is-dark is-rounded text-center"
                                style={{ padding: "0.75rem", borderColor: "#334155" }}
                            >
                                <span className="text-slate-400" style={{ fontSize: 8 }}>
                                    DESAFIO DO DIA
                                </span>
                                <p className="text-white mt-2" style={{ fontSize: 14 }}>
                                    {palavrasDoJogo.inicial}
                                </p>
                                <p className="text-blue-400" style={{ fontSize: 12 }}>
                                    ↓
                                </p>
                                <p className="text-white" style={{ fontSize: 14 }}>
                                    {palavrasDoJogo.objetivo}
                                </p>
                            </div>
                        ) : (
                            <div
                                className="nes-container is-dark is-rounded text-center"
                                style={{ padding: "0.75rem" }}
                            >
                                <p className="text-slate-500" style={{ fontSize: 9 }}>
                                    Nenhum desafio registrado nessa data.
                                </p>
                            </div>
                        )}

                        {/* SCOREBOARD */}
                        {recordes.length > 0 && (
                            <div className="overflow-x-hidden relative">
                                <table className="nes-table is-bordered is-dark w-full" style={{ fontSize: 16 }}>
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
                                                <td style={{ fontSize: 16 }}>{medalha[idx] ?? idx + 1}</td>
                                                <td
                                                    style={{ fontSize: 16 }}
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
                                                <td style={{ fontSize: 16 }}>{recorde.pontos}</td>
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
