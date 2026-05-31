"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

type VoceVenceuProps = {
    historico: string[];
    passos: number;
    iniciarNovoJogo: () => void;
    modoDeJogo: "diario" | "aleatorio";
    seedProp?: string;
};

type Recorde = {
    id: number;
    jogador_nome: string;
    pontuacao: number;
};

export default function VoceVenceu({ historico, passos, modoDeJogo, iniciarNovoJogo, seedProp }: VoceVenceuProps) {
    const router = useRouter();

    const [dataCompleta, setDataCompleta] = useState<Date | null>(null); // começa com o horário local para o timer iniciar imediatamente
    const chaveRecorde = `desafio-diario-${seedProp}-recorde-enviado`; // chave que verifica se o recorde já foi enviado hoje
    const [nome, setNome] = useState(""); // estado para armazenar o nome do jogador
    const [recordes, setRecordes] = useState<Recorde[]>([]); // estado para armazenar os recordes do dia buscados do supabase
    const idPalavraDoDia = useRef<number | null>(null); // id da palavra do dia, necessário para enviar o recorde pro supabase
    const [tempoRestante, setTempoRestante] = useState(""); // estado para armazenar o tempo restante para a próxima palavra do dia
    const [recordeEnviado, setRecordeEnviado] = useState(() => !!localStorage.getItem(chaveRecorde)); // estado para verificar se o recorde já foi enviado hoje, inicializado com base no localStorage

    // ==== BUSCA O HÓRARIO E DATA DO SERVIDOR ====
    // Busca o horário exato do servidor UMA vez na montagem.
    // Usamos o servidor para evitar que fusos horários diferentes causem inconsistências
    // (ex: usuário no Japão já está no dia seguinte enquanto o Brasil ainda está no dia anterior).
    useEffect(() => {
        async function pegarDataEHoraDoServidor() {
            try {
                await fetch("/api/dataDoDiaDoServidor")
                    .then((response) => response.json())
                    .then((data) => {
                        setDataCompleta(new Date(data.dataCompleta));
                    })
                    .catch((error) => {
                        console.error("Erro ao buscar data do dia do servidor:", error);
                    });
            } catch (error) {
                console.error("Erro ao buscar data do dia do servidor:", error);
            }
        }

        pegarDataEHoraDoServidor();
    }, []); // [] → roda só uma vez na montagem, não a cada render

    // ==== CALCULA O TEMPO RESTANTE P PRÓXIMA PALAVRA DO DIA ====
    // Calcula o tempo restante até a meia-noite do servidor (UTC) e atualiza a cada segundo.
    useEffect(() => {
        // Só roda no modo diário e depois que o horário do servidor chegou.
        if (modoDeJogo !== "diario" || !dataCompleta) return;

        // Cria uma cópia do horário do servidor e avança para a próxima meia-noite UTC.
        // setUTCHours(24, ...) = meia-noite UTC do dia seguinte.
        const meianoiteUTC = new Date(dataCompleta);
        meianoiteUTC.setUTCHours(24, 0, 0, 0);

        let diff = meianoiteUTC.getTime() - dataCompleta.getTime();

        const formatar = () => {
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

        formatar(); // seta o valor imediatamente, sem esperar 1 segundo
        const intervalo = setInterval(() => {
            diff -= 1000;
            formatar();
        }, 1000);

        // Limpa o intervalo quando o componente desmonta para não vazar memória.
        return () => clearInterval(intervalo);
    }, [modoDeJogo, dataCompleta]); // roda quando dataCompleta chegar (inicialmente null)

    // ==== ENVIA O RECORDE PARA O SERVIDOR ====
    const handleEnviar = async () => {
        if (nome.length < 1 || nome.length > 20) {
            console.error("Nome inválido. Deve ter entre 1 e 20 caracteres.");
            return;
        }
        if (!nome.trim()) return;

        const { error } = await supabase.from("recordes").insert({
            jogador_nome: nome,
            pontuacao: passos,
            id_palavras_do_dia: idPalavraDoDia.current,
        });

        if (error) {
            console.error("Erro ao enviar recorde:", error);
            return;
        }

        localStorage.setItem(chaveRecorde, "true");
        setRecordeEnviado(true);
    };

    // ==== PEGA OS RECORDES DEPOIS DE HOJE ====
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
                    idPalavraDoDia.current = data.id;

                    // depois pega os recordes com o id da palavra do dia
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
    }, [recordes, seedProp]);

    return (
        <div className="fixed pixel-font inset-0 z-1000 bg-slate-950/90 backdrop-blur-md overflow-x-hidden overflow-y-auto flex justify-center p-4 scrollbar-dark">
            <div
                className="nes-container is-dark is-rounded w-full max-w-lg text-center self-start"
                style={{ padding: "2rem", borderColor: "#3b82f6" }}
            >
                <h2 className=" text-white flex items-center justify-evenly text-xl md:text-3xl">
                    <i className="nes-icon trophy is-medium"></i> VITÓRIA! <i className="nes-icon trophy is-medium"></i>
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
                            className="nes-input is-dark w-full"
                            placeholder={recordeEnviado ? "RECORDE JÁ ENVIADO" : "SEU NOME"}
                            maxLength={20}
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            disabled={recordeEnviado}
                            style={{ fontSize: "11px" }}
                        />
                        <button
                            onClick={handleEnviar}
                            className={`nes-btn w-full ${recordeEnviado ? "is-disabled" : "is-success"}`}
                            disabled={recordeEnviado}
                            style={{ fontSize: "11px" }}
                        >
                            {recordeEnviado ? "✓ RECORDE ENVIADO" : "► ENVIAR RECORDE"}
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
                    onClick={() => (modoDeJogo === "aleatorio" ? iniciarNovoJogo() : router.push("/jogar"))}
                    className="nes-btn is-primary w-full "
                    style={{ fontSize: "11px" }}
                >
                    ► JOGAR MODO ALEATÓRIO
                </button>
            </div>
        </div>
    );
}
