"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useUsuario } from "../lib/userContext";

type VoceVenceuProps = {
    historico: string[];
    pontos: number;
    modoDeJogo: "diario" | "aleatorio";
    novoJogo?: () => void;
    seedProp?: string;
};

type Recorde = {
    id: number;
    jogador_nome: string;
    pontos: number;
};

export default function VoceVenceu({ historico, pontos, modoDeJogo, novoJogo, seedProp }: VoceVenceuProps) {
    const router = useRouter();

    const [recordes, setRecordes] = useState<Recorde[]>([]);
    const [carregandoRecores, setCarregandoRecordes] = useState<boolean>(true);
    const [idPalavraDoDia, setIdPalavraDoDia] = useState<number | null>(null);
    const [tempoRestante, setTempoRestante] = useState("");
    const [historicoCopiado, setHistoricoCopiado] = useState(false);
    const { usuario, carregando } = useUsuario();

    const [reticencias, setReticencias] = useState(1);

    // animação das reticências
    useEffect(() => {
        if (recordes) return;
        const id = setInterval(() => setReticencias((p) => (p >= 3 ? 1 : p + 1)), 400);
        return () => clearInterval(id);
    }, [recordes]);

    // ==== CALCULA O TEMPO RESTANTE P PRÓXIMA PALAVRA DO DIA ====
    useEffect(() => {
        if (modoDeJogo !== "diario") return;

        const calcular = () => {
            // Brasília é UTC-3. Meia-noite de Brasília = 03:00 UTC.
            // setUTCHours(27) = 24 + 3 = próxima meia-noite de Brasília em UTC.
            const agora = new Date();
            const meianoite = new Date(agora);
            meianoite.setUTCHours(3, 0, 0, 0); // 03:00 UTC = meia-noite de Brasília
            if (agora >= meianoite) {
                meianoite.setUTCDate(meianoite.getUTCDate() + 1); // já passou, próxima é amanhã
            }

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

    // ==== BUSCA RECORES DO DIA NO BANCO ====
    // auto-envia quando usuario E idPalavraDoDia estiverem disponíveis
    useEffect(() => {
        if (modoDeJogo !== "diario") return;
        if (!usuario || !idPalavraDoDia) return;

        // verifica no banco se já existe recorde deste usuário para hoje
        supabase
            .from("recordes")
            .select("id")
            .eq("id_palavras_do_dia", idPalavraDoDia)
            .eq("jogador_nome", usuario.nome)
            .maybeSingle()
            .then(({ data }) => {
                if (data) return; // já enviou, não duplica

                supabase
                    .from("recordes")
                    .insert({ jogador_nome: usuario.nome, pontos, id_palavras_do_dia: idPalavraDoDia })
                    .then(({ error }) => {
                        if (error) {
                            console.error("Erro ao salvar recorde:", error);
                            return;
                        }

                        supabase
                            .from("recordes")
                            .select("id, jogador_nome, pontos")
                            .eq("id_palavras_do_dia", idPalavraDoDia)
                            .then(({ data }) => {
                                if (data) setRecordes(data);
                            });
                    });
            });
    }, [usuario, idPalavraDoDia, pontos, modoDeJogo]);

    // ==== PEGA OS RECORDES DE HOJE ====
    // Pega os Recordes de hoje do supabase para montar
    // a tabela de recordes na tela de vitória.
    // Atualiza sempre que os recordes mudarem, para mostrar o novo recorde enviado.
    useEffect(() => {
        if (!seedProp) return;
        const dataDeHoje = seedProp;

        // primeiro pega o id da palavra de hoje
        supabase
            .from("palavras_do_dia")
            .select("id")
            .eq("data", dataDeHoje)
            .maybeSingle()
            .then(({ data, error }) => {
                if (error) {
                    console.error("Erro ao buscar palavra do dia:", error);
                }
                if (data && data.id) {
                    setIdPalavraDoDia(data.id);

                    // depois pega os recordes com o id da palavra do dia
                    supabase
                        .from("recordes")
                        .select("id, jogador_nome, pontos")
                        .eq("id_palavras_do_dia", data.id)
                        .then(({ data, error }) => {
                            if (error) {
                                console.error("Erro ao buscar recordes:", error);
                            }
                            if (data) {
                                console.log("loop");
                                setRecordes(data);
                                setCarregandoRecordes(false);
                            }
                        });
                } else {
                    console.log("Palavra do dia não encontrada para a data:", dataDeHoje);
                }
            });
    }, [seedProp]);

    // ==== COPIA O HISTORICO FORMATADO PARA O CLIPBOARD ====
    function handleClickCopiarHistorico() {
        const copiaHistorico = [...historico];
        // deixando o objetivo bonito (ultimo elemento )
        copiaHistorico[copiaHistorico.length - 1] = `${copiaHistorico[copiaHistorico.length - 1]} 🏁 `;
        copiaHistorico[0] = `→${copiaHistorico[0]}`;

        const caminho = copiaHistorico.join("\n→");
        const texto = `🏆 WikiRun\n${modoDeJogo === "diario" ? "Desafio Diário" : "Aleatório"}\nPontos: ${pontos} | Saltos: ${historico.length - 1}\n\n${caminho}\n\nConsegue fazer melhor? 🫵\nhttps://wikigame-five.vercel.app/diario`;

        navigator.clipboard.writeText(texto).then(() => {
            setHistoricoCopiado(true);
            setTimeout(() => setHistoricoCopiado(false), 2000);
        });
    }

    return (
        <div className="fixed pixel-font inset-0 z-1000 bg-slate-950/90 backdrop-blur-md overflow-x-hidden overflow-y-auto flex justify-center p-4 scrollbar-dark">
            <div
                className="nes-container is-dark is-rounded w-full max-w-lg text-center self-start"
                style={{ padding: "2rem", borderColor: "#3b82f6" }}
            >
                {/* MENSAGEM DE VITÓRIA */}
                <h2 className=" text-white flex items-center justify-evenly text-xl md:text-3xl">
                    <i className="nes-icon trophy is-medium"></i> VITÓRIA! <i className="nes-icon trophy is-medium"></i>
                </h2>

                {/* MODO DE JOGO */}
                <p className=" text-blue-400 mb-6 leading-7" style={{ fontSize: "9px" }}>
                    {modoDeJogo === "diario" ? "DESAFIO DIÁRIO CONCLUÍDO" : "VOCÊ CHEGOU AO DESTINO!"}
                </p>

                {/* STATUS DO JOGO FINALIZADO */}
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
                            PONTOS
                        </span>
                        <span className=" text-white" style={{ fontSize: "24px" }}>
                            {pontos}
                        </span>
                    </div>
                </div>

                {/* HISTORICO DO CAMINHO PERCORRIDO */}
                <div
                    className="nes-container is-dark is-rounded text-left overflow-y-auto "
                    style={{ padding: "0.75rem", maxHeight: "200px", borderColor: "#1e293b" }}
                >
                    <span className=" text-blue-400 block mb-3" style={{ fontSize: "8px" }}>
                        CAMINHO PERCORRIDO
                    </span>
                    <div className="flex flex-col gap-2 relative">
                        {/* botão de copiar */}
                        <span
                            onClick={handleClickCopiarHistorico}
                            className={`absolute -right-1 -top-7 w-7 h-7 flex text-lg items-center justify-center cursor-pointer select-none transition-colors active:scale-95
                                ${
                                    historicoCopiado
                                        ? "text-green-300 border-green-300"
                                        : "text-blue-400 border-blue-400 hover:text-blue-300 hover:border-blue-300"
                                }`}
                        >
                            {historicoCopiado ? (
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                >
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            ) : (
                                "⧉"
                            )}
                        </span>

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

                {/* INFORMAÇÃO EXTRA SE FOR O MODO JOGO DIÁRIO */}
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

                        {!usuario && !carregando && (
                            <button
                                onClick={() => router.push("/registro")}
                                className={`nes-btn w-full is-success`}
                                style={{ fontSize: "12px" }}
                            >
                                ✓ Registre-se para participar!
                            </button>
                        )}

                        {/* RECORDISTAS DO DIA */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-around">
                                <h3>Jogadores</h3>
                                <span>|</span>
                                <h3 className=" ">Pontos</h3>
                            </div>
                            {/* RECORDES */}
                            {!carregandoRecores ? (
                                recordes
                                    .sort((a, b) => a.pontos - b.pontos)
                                    .map((recorde, idx) => (
                                        <div key={recorde.id} className={`flex items-center gap-4 px-8  `}>
                                            <span
                                                className={` text-xs
                                            ${idx === 0 && "text-yellow-500 "} 
                                            ${idx === 1 && "text-amber-300"} 
                                            ${idx === 2 && "text-orange-200 "} 
                                        `}
                                            >
                                                {idx + 1}
                                            </span>

                                            <span
                                                className={`text-md truncate
                                            ${idx === 0 && "text-yellow-500"} 
                                            ${idx === 1 && "text-amber-200"} 
                                            ${idx === 2 && "text-orange-100"} 
                                        `}
                                            >
                                                {recorde.jogador_nome}
                                            </span>
                                            <span className="text-slate-200 shrink-0 ml-auto">
                                                {usuario ? recorde.pontos : "???"}
                                            </span>
                                        </div>
                                    ))
                            ) : (
                                <div className="flex items-center gap-4 px-8">
                                    <span className={`${"text-gray-500 text-md animate-bounce"}`}>
                                        Carregando{".".repeat(reticencias)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {/* se já está na página, reseta o jogo */}
                {novoJogo && (
                    <button onClick={novoJogo} className="nes-btn w-full is-primary mb-2" style={{ fontSize: "14px" }}>
                        Jogar novamente!
                    </button>
                )}
                {/* se está no desafio diário, redireciona */}
                {usuario && (
                    <button
                        onClick={() => router.push("/jogar")}
                        className="nes-btn w-full"
                        style={{ fontSize: "14px" }}
                    >
                        Jogar mais!
                    </button>
                )}
            </div>
        </div>
    );
}
