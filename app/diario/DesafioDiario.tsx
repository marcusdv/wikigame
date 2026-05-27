"use client";
import { useGameLogic } from "../lib/useGameLogic";
import BarraSuperiorFixa from "../components/BarraSuperiorFixa";
import Footer from "../components/Footer";
import VoceVenceu from "../components/VoceVenceuTela";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type DadosLocalStorage = {
    pagina: string;
    historico: string[];
    passos: number;
};

export default function DesafioDiario() {
    const [localStorageCarregado, setLocalStorageCarregado] = useState(false);

    // Gera a seed com a data de hoje no formato "2026-05-24".
    // Isso garante que todos os jogadores recebem o mesmo par
    // de páginas no mesmo dia, como o Wordle.
    const d = new Date();
    const seed = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    //
    // Passa a seed pro hook — com seed, sortearJogo() é
    // determinístico em vez de aleatório.
    const {
        carregando,
        voceVenceu,
        setVoceVenceu,
        historico,
        passos,
        setHistorico,
        setPassos,
        setPaginaAtual,
        paginaObjetivo,
        pontoFlutuante,
        wikiHtml,
        iniciarNovoJogo,
        handleVoltar,
        handleNavegarPeloHistorico,
        handleLinkClicado,
    } = useGameLogic(seed, localStorageCarregado);

    // Ao carregar a página, tenta recuperar o progresso salvo no localStorage.
    // O useGameLogic, se enviado como false no 2 parametro, ele bloqueia a requisição a API do wiki.
    // Isso é importante para evitar que a página inicial seja carregada antes de o localStorage ser carregado,
    // E protege para que não carregue a página inicial sorteada.

    // 1. paginaAtual = "Canguru", podeChamarAPI = false
    // 2. fetch tenta rodar → !podeChamarAPI → bloqueia ← nenhuma requisição
    // 3. localStorage carrega → setPaginaAtual("Artiodátilos") + podeChamarAPI = true
    // 4. fetch roda → busca "Artiodátilos" ← única requisição, certa

    useEffect(() => {
        try {
            const dadosSalvosJSON = localStorage.getItem(`desafio-diario-${seed}`);
            if (dadosSalvosJSON) {
                const dados = JSON.parse(dadosSalvosJSON);
                if (dados.historico && dados.passos) {
                    setHistorico(dados.historico);
                    setPassos(dados.passos);
                    setPaginaAtual(dados.historico[dados.historico.length - 1]);
                }
            }

            if (localStorage.getItem(`desafio-diario-${seed}-vitoria`)) {
                setVoceVenceu(true);
            }
        } catch (error) {
            console.error("Erro ao carregar progresso do localStorage:", error);
        } finally {
            setLocalStorageCarregado(true);
        }
    }, [seed, setHistorico, setPassos, setPaginaAtual, setVoceVenceu]);

    // Salva o progresso no localStorage a cada mudança no histórico ou passos.
    // Quero salvar sempre que o jogador fizer um movimento.
    useEffect(() => {
        if (!localStorageCarregado) return;
        if (historico.length < 1) return;

        try {
            const dados: DadosLocalStorage = {
                pagina: historico[historico.length - 1],
                historico: [...historico],
                passos,
            };
            // seed é a data de hoje, então a chave é única por dia. Formato: "desafio-diario-2026-05-24"
            localStorage.setItem(`desafio-diario-${seed}`, JSON.stringify(dados));
        } catch {
            // localStorage pode falhar se:
            // - o storage estiver cheio (quota exceeded)
            // - o browser estiver em modo privado com storage bloqueado
            // - o usuário tiver desabilitado o localStorage
            console.error("Erro ao salvar progresso");
        }
    }, [historico, passos, seed, localStorageCarregado]);

    // Salva a vitória no localStorage para mostrar o modal mesmo se o jogador recarregar a página após vencer.
    useEffect(() => {
        if (!voceVenceu) return;
        localStorage.setItem(`desafio-diario-${seed}-vitoria`, "true");
    }, [voceVenceu, seed]);

    // Ao carregar o desafio diário, salva a configuração do dia no banco, caso ainda não exista.
    useEffect(() => {
        const palavraDoDiaSalvaNoBanco = `palavras-do-dia-salvo-no-banco${seed}`;
        if (localStorage.getItem(palavraDoDiaSalvaNoBanco)) return; // já foi salvo hoje, pula

        console.log("TENTANDO SALVAR PALAVRA DO DIA NO BANCO...");
        supabase
            .from("palavras_do_dia")
            .select("id")
            .eq("data", seed)
            .maybeSingle()
            .then(async ({ data }) => {
                if (!data) {
                    const { error } = await supabase.from("palavras_do_dia").insert({
                        inicial: historico[0],
                        objetivo: paginaObjetivo,
                        data: seed,
                    });
                    if (error) {
                        console.error("Erro ao inserir palavra do dia:", error);
                        return;
                    }
                }
                localStorage.setItem(palavraDoDiaSalvaNoBanco, "true");
            });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="min-h-screen flex flex-col justify-between">
            {/* Cortina semitransparente que bloqueia interação enquanto a página carrega */}
            {carregando && (
                <div className="fixed inset-0 z-999 bg-slate-950/20 backdrop-blur-2xs flex items-center justify-center">
                    <div className="bg-slate-900/90 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800">
                        <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                        <span className="text-xs font-bold tracking-wide">Carregando conteúdo...</span>
                    </div>
                </div>
            )}

            {/* Modal de vitória — aparece quando o jogador atinge o objetivo */}
            {voceVenceu && (
                <VoceVenceu
                    historico={historico}
                    passos={passos}
                    modoDeJogo={"diario"}
                    iniciarNovoJogo={iniciarNovoJogo}
                />
            )}

            <div>
                {/* Barra fixa com HUD de pontos, breadcrumb do histórico e objetivo */}
                <BarraSuperiorFixa
                    historico={historico}
                    passos={passos}
                    handleVoltar={handleVoltar}
                    pontoFlutuante={pontoFlutuante}
                    paginaObjetivo={paginaObjetivo}
                    handleNavegarParaHistorico={handleNavegarPeloHistorico}
                    tema={"desafio"}
                    titulo={"Desafio Diário"}
                />

                {/* Container do artigo. Delegamos cliques aqui para capturar qualquer link filho. */}
                <div
                    onClick={handleLinkClicado}
                    id="wikicontent"
                    className="my-3 px-4 sm:px-8 py-6 max-w-7xl mx-auto bg-white shadow-xl min-h-screen"
                    dangerouslySetInnerHTML={{ __html: wikiHtml }}
                />
            </div>

            <Footer historico={historico} />
        </div>
    );
}
