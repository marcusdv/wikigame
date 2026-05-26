"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type VoceVenceuProps = {
    historico: string[];
    passos: number;
    iniciarNovoJogo: () => void;
    modoDeJogo: "diario" | "aleatorio";
};

type Recorde = {
    id: number;
    jogador_nome: string;
    pontuacao: number;
};

export default function VoceVenceu({ historico, passos, iniciarNovoJogo, modoDeJogo }: VoceVenceuProps) {
    const router = useRouter();
    const [nome, setNome] = useState("");
    const [recordes, setRecordes] = useState<Recorde[]>([]);
    const [idPalavraDoDia, setIdPalavraDoDia] = useState<number | null>(null);
    const [tempoRestante, setTempoRestante] = useState("");

    useEffect(() => {
        if (modoDeJogo !== "diario") return;

        const calcular = () => {
            const agora = new Date();
            const meianoite = new Date();
            meianoite.setHours(24, 0, 0, 0);
            const diff = meianoite.getTime() - agora.getTime();
            const h = Math.floor(diff / 3600000)
                .toString()
                .padStart(2, "0");
            const m = Math.floor((diff % 3600000) / 60000)
                .toString()
                .padStart(2, "0");
            const s = Math.floor((diff % 60000) / 1000)
                .toString()
                .padStart(2, "0");
            setTempoRestante(`${h}:${m}:${s}`);
        };

        calcular();
        const intervalo = setInterval(calcular, 1000);
        return () => clearInterval(intervalo);
    }, [modoDeJogo]);

    const handleEnviar = async () => {
        if (nome.length < 1 || nome.length > 20) {
            console.error("Nome inválido. Deve ter entre 1 e 20 caracteres.");
            return;
        }
        if (!nome.trim()) return;

        const { data, error } = await supabase.from("recordes").insert({
            jogador_nome: nome,
            pontuacao: passos,
            id_palavras_do_dia: idPalavraDoDia, // Substitua pelo ID correto do desafio diário
        });

        if (error) {
            console.error("Erro ao enviar recorde:", error);
        }

        if (data) {
            console.log("Recorde enviado com sucesso:", data);
        }
    };

    useEffect(() => {
        const dataDeHoje = new Date().toISOString().slice(0, 10);
        console.log(dataDeHoje);

        supabase
            .from("palavras_do_dia")
            .select("id")
            .eq("data", dataDeHoje)
            .single()
            .then(({ data, error }) => {
                if (error) {
                    console.error("Erro ao buscar palavra do dia:", error);
                }
                if (data && data.id) {
                    setIdPalavraDoDia(data.id);

                    supabase
                        .from("recordes")
                        .select("id, jogador_nome, pontuacao")
                        .eq("id_palavras_do_dia", data.id)
                        .then(({ data, error }) => {
                            if (error) {
                                console.error("Erro ao buscar recordes:", error);
                            }
                            if (data) {
                                setRecordes(data);
                            }
                        });
                } else {
                    console.log("Palavra do dia não encontrada para a data:", dataDeHoje);
                }
            });
    }, [recordes]);

    return (
        <div className="fixed pixel-font inset-0 z-1000 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div
                className="nes-container is-dark is-rounded w-full max-w-lg text-center"
                style={{ padding: "2rem", borderColor: "#3b82f6" }}
            >
                <div className="text-5xl mb-4">🏆</div>

                <h2 className=" text-white mb-2" style={{ fontSize: "22px" }}>
                    VITÓRIA!
                </h2>
                <p className=" text-blue-400 mb-6 leading-7" style={{ fontSize: "9px" }}>
                    {modoDeJogo === "diario" ? "DESAFIO DIÁRIO CONCLUÍDO" : "VOCÊ CHEGOU AO DESTINO!"}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div
                        className="nes-container is-dark is-rounded"
                        style={{ padding: "0.75rem", borderColor: "#334155" }}
                    >
                        <span className=" text-blue-400 block mb-2" style={{ fontSize: "8px" }}>
                            SALTOS
                        </span>
                        <span className=" text-white" style={{ fontSize: "24px" }}>
                            {historico.length - 1}
                        </span>
                    </div>
                    <div
                        className="nes-container is-dark is-rounded"
                        style={{ padding: "0.75rem", borderColor: "#334155" }}
                    >
                        <span className=" text-blue-400 block mb-2" style={{ fontSize: "8px" }}>
                            PASSOS
                        </span>
                        <span className=" text-white" style={{ fontSize: "24px" }}>
                            {passos}
                        </span>
                    </div>
                </div>

                <div
                    className="nes-container is-dark is-rounded text-left overflow-y-auto "
                    style={{ padding: "0.75rem", maxHeight: "150px", borderColor: "#1e293b" }}
                >
                    <span className=" text-blue-400 block mb-3" style={{ fontSize: "8px" }}>
                        CAMINHO PERCORRIDO
                    </span>
                    <div className="flex flex-col gap-2">
                        {historico.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                <span className=" text-slate-600 shrink-0 w-5" style={{ fontSize: "8px" }}>
                                    {idx}
                                </span>
                                <span
                                    className={` truncate ${idx === historico.length - 1 ? "text-blue-300" : "text-slate-400"}`}
                                    style={{ fontSize: "9px" }}
                                >
                                    {item}
                                </span>
                                {idx < historico.length - 1 && (
                                    <span className="text-slate-600 shrink-0" style={{ fontSize: "10px" }}>
                                        ▶
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {modoDeJogo === "diario" && (
                    <div className="flex flex-col gap-3 mb-4">
                        <div
                            className="nes-container is-dark is-rounded"
                            style={{ padding: "0.5rem", borderColor: "#334155" }}
                        >
                            <span className="text-slate-400 block" style={{ fontSize: "8px" }}>
                                PRÓXIMA PALAVRA EM
                            </span>
                            <span className="text-white font-mono" style={{ fontSize: "20px" }}>
                                {tempoRestante}
                            </span>
                        </div>
                        <input
                            type="text"
                            className="nes-input is-dark w-full "
                            placeholder="SEU NOME"
                            maxLength={20}
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            style={{ fontSize: "11px" }}
                        />
                        <button
                            onClick={handleEnviar}
                            className="nes-btn is-success w-full  "
                            style={{ fontSize: "11px" }}
                        >
                            ► ENVIAR RECORDE
                        </button>

                        <div className="flex flex-col gap-2">
                            <div className="flex justify-evenly">
                                <h3>Jogadores</h3>
                                <span>|</span>
                                <h3 className=" ">Passos</h3>
                            </div>
                            {recordes
                                ?.sort((a, b) => a.pontuacao - b.pontuacao)
                                .map((recorde, idx) => (
                                    <div key={recorde.id} className="flex items-center gap-3 ">
                                        <span
                                            className={` 
                                            
                                            ${idx === 0 ? "text-yellow-500 text-lg animate-bounce" : "text-sm"} 
                                            ${idx === 1 && "text-amber-300"} 
                                            ${idx === 2 && "text-orange-200 "} 
                                        `}
                                        >
                                            {idx + 1}
                                        </span>

                                        <span
                                            className={` 
                                            
                                            truncate ${idx === 0 ? "text-yellow-400 text-lg animate-bounce" : "text-sm"} 
                                            ${idx === 1 && "text-amber-200"} 
                                            ${idx === 2 && "text-orange-100"} 
                                        `}
                                        >
                                            {recorde.jogador_nome}
                                        </span>
                                        <span className="text-slate-200 shrink-0" style={{ fontSize: "14px" }}>
                                            - {recorde.pontuacao}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={() => router.push("/jogar")}
                    className="nes-btn is-primary w-full "
                    style={{ fontSize: "11px" }}
                >
                    ► JOGAR MODO ALEATÓRIO
                </button>
            </div>
        </div>
    );
}
