"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useUsuario } from "../lib/userContext";

type VoceVenceuProps = {
    historico: string[]; // lista de páginas visitadas
    pontos: number; // pontuação final do jogador
    modoDeJogo: "diario" | "aleatorio";
    novoJogo?: () => void; // só presente no modo aleatório
    seedProp?: string; // data do desafio ("2026-07-05"), usada para buscar a palavra do dia
};

type Recorde = {
    id: number;
    pontos: number;
    nome: string; // nome do usuário, resolvido via buscarRecordesComNomes
};

// ==== BUSCA RECORDES COM NOMES DOS JOGADORES ====
// Equivalente a:
// SELECT recordes.id, recordes.pontos, usuarios.nome FROM recordes
// JOIN usuarios ON usuarios.id = recordes.id_usuario
// WHERE recordes.id_palavras_do_dia = idPalavraDoDia
//
// Usamos duas queries separadas em vez do JOIN embutido do PostgREST
// (.select("usuarios!id_usuario(nome)")) porque o PostgREST avalia RLS de forma
// diferente no embedding e retorna null/vazio silenciosamente, mesmo com GRANT e
// política configurados. As duas queries diretas funcionam corretamente.
async function buscarRecordesComNomes(idPalavraDoDia: number): Promise<Recorde[]> {
    // Query 1: recordes do dia
    const { data: recordesData, error } = await supabase
        .from("recordes")
        .select("id, pontos, id_usuario")
        .eq("id_palavras_do_dia", idPalavraDoDia);

    if (error || !recordesData || recordesData.length === 0) return [];

    // Query 2: nomes dos usuários presentes nos recordes (WHERE id IN (...))
    const ids = recordesData.map((r) => r.id_usuario).filter(Boolean);
    const { data: usuariosData } = await supabase.from("usuarios").select("id, nome").in("id", ids);

    // Merge no cliente: liga cada recorde ao nome do seu usuário pelo id
    return recordesData.map((r) => ({
        id: r.id,
        pontos: r.pontos,
        nome: usuariosData?.find((u) => u.id === r.id_usuario)?.nome ?? "?",
    }));
}

export default function VoceVenceu({ historico, pontos, modoDeJogo, novoJogo, seedProp }: VoceVenceuProps) {
    const router = useRouter();

    const [recordes, setRecordes] = useState<Recorde[]>([]);
    const [carregandoRecordes, setCarregandoRecordes] = useState<boolean>(true); // controla o spinner da lista de recordes
    const [idPalavraDoDia, setIdPalavraDoDia] = useState<number | null>(null); // id da linha em palavras_do_dia
    const [tempoRestante, setTempoRestante] = useState(""); // string "HH:MM:SS" para o contador regressivo
    const [historicoCopiado, setHistoricoCopiado] = useState(false); // feedback visual do botão de copiar
    const { usuario, carregando } = useUsuario();

    const [reticencias, setReticencias] = useState(1); // 1, 2 ou 3 — anima "Carregando..."

    // ==== ANIMA AS RETICÊNCIAS ENQUANTO OS RECORDES CARREGAM ====
    // Incrementa 1→2→3→1→... a cada 400ms. Para quando carregandoRecordes vira false.
    useEffect(() => {
        if (!carregandoRecordes) return;
        const id = setInterval(() => setReticencias((p) => (p >= 3 ? 1 : p + 1)), 400);
        return () => clearInterval(id); // limpa o intervalo ao desmontar ou quando parar de carregar
    }, [carregandoRecordes]);

    // ==== CALCULA O TEMPO RESTANTE PARA A PRÓXIMA PALAVRA DO DIA ====
    // Roda só no modo diário. Atualiza a cada segundo.
    useEffect(() => {
        if (modoDeJogo !== "diario") return;

        const calcular = () => {
            // Brasília é UTC-3 → meia-noite de Brasília = 03:00 UTC
            const agora = new Date();
            const meianoite = new Date(agora);
            meianoite.setUTCHours(3, 0, 0, 0); // fixa em 03:00 UTC do dia atual
            if (agora >= meianoite) {
                meianoite.setUTCDate(meianoite.getUTCDate() + 1); // se já passou, aponta para amanhã
            }

            const diff = meianoite.getTime() - agora.getTime(); // diferença em ms
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

        calcular(); // roda imediatamente para não haver delay inicial de 1s
        const intervalo = setInterval(calcular, 1000);
        return () => clearInterval(intervalo);
    }, [modoDeJogo]);

    // ==== SALVA O RECORDE DO USUÁRIO E ATUALIZA A LISTA ====
    // Dispara quando o usuário vence e o idPalavraDoDia já foi resolvido.
    // Usa upsert para não duplicar: se o usuário já tem recorde de hoje, ignora.
    useEffect(() => {
        if (modoDeJogo !== "diario") return;
        if (!usuario || !idPalavraDoDia) return; // aguarda os dois estarem disponíveis

        supabase
            .from("recordes")
            .upsert(
                { id_usuario: usuario.id, pontos, id_palavras_do_dia: idPalavraDoDia },
                { onConflict: "id_usuario,id_palavras_do_dia", ignoreDuplicates: true },
                // onConflict: define qual constraint identificar o conflito
                // ignoreDuplicates: se já existe, não atualiza (mantém o recorde original)
            )
            .then(({ error }) => {
                if (error) {
                    console.error("Erro ao salvar recorde:", error);
                    return;
                }
                // Após salvar, atualiza a lista de recordes do dia (inclui o recorde recém inserido)
                buscarRecordesComNomes(idPalavraDoDia).then((data) => setRecordes(data));
            });
    }, [usuario, idPalavraDoDia, pontos, modoDeJogo]);

    // ==== BUSCA O ID DA PALAVRA DO DIA E OS RECORDES ====
    // Roda ao montar o componente para carregar a lista de recordes do dia,
    // mesmo quando o usuário já tinha vencido antes (sem fazer upsert novamente).
    // O idPalavraDoDia resolvido aqui também é usado pelo useEffect de upsert acima.
    useEffect(() => {
        if (!seedProp) return;

        supabase
            .from("palavras_do_dia")
            .select("id")
            .eq("data", seedProp) // busca pelo "2026-07-05" para pegar o id numérico
            .maybeSingle() // retorna null se não encontrar (sem lançar erro)
            .then(({ data, error }) => {
                if (error) console.error("Erro ao buscar palavra do dia:", error);

                if (data?.id) {
                    setIdPalavraDoDia(data.id); // disponibiliza o id para o useEffect de upsert
                    buscarRecordesComNomes(data.id).then((recordes) => {
                        setRecordes(recordes);
                        setCarregandoRecordes(false); // libera a lista para exibição
                    });
                }
            });
    }, [seedProp]);

    // ==== COPIA O HISTÓRICO FORMATADO PARA O CLIPBOARD ====
    function handleClickCopiarHistorico() {
        const copiaHistorico = [...historico]; // cópia para não mutar o estado

        // Formata o último item (objetivo) com a bandeirinha e o primeiro com a seta de partida
        copiaHistorico[copiaHistorico.length - 1] = `${copiaHistorico[copiaHistorico.length - 1]} 🏁 `;
        copiaHistorico[0] = `→${copiaHistorico[0]}`;

        const caminho = copiaHistorico.join("\n→"); // cada página em uma linha com seta
        const texto = `🏆 WikiRun\n${modoDeJogo === "diario" ? "Desafio Diário" : "Aleatório"}\nPontos: ${pontos} | Saltos: ${historico.length - 1}\n\n${caminho}\n\nConsegue fazer melhor? 🫵\nhttps://wikigame-five.vercel.app/diario`;

        navigator.clipboard.writeText(texto).then(() => {
            setHistoricoCopiado(true);
            setTimeout(() => setHistoricoCopiado(false), 2000); // reseta o ícone após 2s
        });
    }

    return (
        <div className="fixed pixel-font inset-0 z-1000 bg-slate-950/90 backdrop-blur-md overflow-x-hidden overflow-y-auto flex justify-center p-4 scrollbar-dark">
            <div
                className="nes-container is-dark is-rounded w-full max-w-lg text-center self-start"
                style={{ padding: "2rem", borderColor: "#3b82f6" }}
            >
                {/* MENSAGEM DE VITÓRIA */}
                <h2 className="text-white flex items-center justify-evenly text-xl md:text-3xl">
                    <i className="nes-icon trophy is-medium"></i> VITÓRIA! <i className="nes-icon trophy is-medium"></i>
                </h2>

                {/* SUBTÍTULO: varia conforme o modo de jogo */}
                <p className="text-blue-400 mb-6 leading-7" style={{ fontSize: "9px" }}>
                    {modoDeJogo === "diario" ? "DESAFIO DIÁRIO CONCLUÍDO" : "VOCÊ CHEGOU AO DESTINO!"}
                </p>

                {/* PLACAR: saltos e pontos lado a lado */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div
                        className="nes-container is-dark is-rounded"
                        style={{ padding: "0.75rem", borderColor: "#334155" }}
                    >
                        <span className="text-blue-400 block mb-2" style={{ fontSize: "8px" }}>
                            SALTOS
                        </span>
                        <span className="text-white" style={{ fontSize: "24px" }}>
                            {historico.length - 1} {/* histórico inclui a página inicial, por isso -1 */}
                        </span>
                    </div>
                    <div
                        className="nes-container is-dark is-rounded"
                        style={{ padding: "0.75rem", borderColor: "#334155" }}
                    >
                        <span className="text-blue-400 block mb-2" style={{ fontSize: "8px" }}>
                            PONTOS
                        </span>
                        <span className="text-white" style={{ fontSize: "24px" }}>
                            {pontos}
                        </span>
                    </div>
                </div>

                {/* CAMINHO PERCORRIDO: lista scrollável com todas as páginas visitadas */}
                <div
                    className="nes-container is-dark is-rounded text-left overflow-y-auto"
                    style={{ padding: "0.75rem", maxHeight: "200px", borderColor: "#1e293b" }}
                >
                    <span className="text-blue-400 block mb-3" style={{ fontSize: "8px" }}>
                        CAMINHO PERCORRIDO
                    </span>
                    <div className="flex flex-col gap-2 relative">
                        {/* Botão de copiar — posicionado no canto superior direito da lista */}
                        <span
                            onClick={handleClickCopiarHistorico}
                            className={`absolute -right-1 -top-7 w-7 h-7 flex text-lg items-center justify-center cursor-pointer select-none transition-colors active:scale-95 ${
                                historicoCopiado
                                    ? "text-green-300 border-green-300" // feedback: copiado
                                    : "text-blue-400 border-blue-400 hover:text-blue-300 hover:border-blue-300"
                            }`}
                        >
                            {historicoCopiado ? (
                                // ícone de check quando copiado
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
                                "⧉" // ícone de copiar
                            )}
                        </span>

                        {historico.map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                                {/* índice da etapa */}
                                <span className="text-slate-600 shrink-0 w-5" style={{ fontSize: "8px" }}>
                                    {idx}
                                </span>
                                {/* nome da página — último item em azul (objetivo alcançado) */}
                                <span
                                    className={`truncate ${idx === historico.length - 1 ? "text-blue-300" : "text-slate-400"}`}
                                    style={{ fontSize: "9px" }}
                                >
                                    {item}
                                </span>
                                {/* seta entre etapas, omitida no último item */}
                                {idx < historico.length - 1 && (
                                    <span className="text-slate-600 shrink-0" style={{ fontSize: "10px" }}>
                                        ▶
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* SEÇÃO EXCLUSIVA DO MODO DIÁRIO */}
                {modoDeJogo === "diario" && (
                    <div className="flex flex-col gap-3 mb-4">
                        {/* Contador regressivo até a próxima palavra */}
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

                        {/* CTA de registro — só aparece para visitantes não logados */}
                        {!usuario && !carregando && (
                            <button
                                onClick={() => router.push("/registro")}
                                className="nes-btn w-full is-success"
                                style={{ fontSize: "12px" }}
                            >
                                ✓ Registre-se para participar!
                            </button>
                        )}

                        {/* RANKING DO DIA */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-around">
                                <h3>Jogadores</h3>
                                <span>|</span>
                                <h3>Pontos</h3>
                            </div>
                            {/* Lista de recordes ou spinner enquanto carrega */}
                            {!carregandoRecordes ? (
                                recordes
                                    .sort((a, b) => a.pontos - b.pontos) // menor pontuação = melhor (menos cliques)
                                    .map((recorde, idx) => (
                                        <div key={recorde.id} className="flex items-center gap-4 px-8">
                                            {/* posição com cor do pódio para os três primeiros */}
                                            <span
                                                className={`text-xs ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-amber-300" : idx === 2 ? "text-orange-200" : ""}`}
                                            >
                                                {idx + 1}
                                            </span>
                                            <span
                                                className={`text-md truncate ${idx === 0 ? "text-yellow-500" : idx === 1 ? "text-amber-200" : idx === 2 ? "text-orange-100" : ""}`}
                                            >
                                                {recorde.nome}
                                            </span>
                                            {/* pontuação oculta para visitantes não logados */}
                                            <span className="text-slate-200 shrink-0 ml-auto">
                                                {usuario ? recorde.pontos : "???"}
                                            </span>
                                        </div>
                                    ))
                            ) : (
                                <div className="flex items-center gap-4 px-8">
                                    <span className="text-gray-500 text-md animate-bounce">
                                        Carregando{".".repeat(reticencias)}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Botão de novo jogo — só presente no modo aleatório (prop novoJogo) */}
                {novoJogo && (
                    <button onClick={novoJogo} className="nes-btn w-full is-primary mb-2" style={{ fontSize: "14px" }}>
                        Jogar novamente!
                    </button>
                )}
                {/* Botão para ir ao modo aleatório — só para usuários logados */}
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
