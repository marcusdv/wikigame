"use client";
import { useGameLogic } from "../lib/useGameLogic";
import BarraSuperiorFixa from "../components/BarraSuperiorFixa";
import Footer from "../components/Footer";
import VoceVenceu from "../components/VoceVenceuTela";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { sortearJogo } from "../lib/sotearJogo";
import { arrPaginasIniciais } from "../data/paginasIniciais";
import { arrPaginasObjetivo } from "../data/paginasObjetivo";

type DadosLocalStorage = {
    historico: string[];
    objetivo: string;
    passos: number;
    jaVenceu: boolean;
};

export default function DesafioDiario() {
    //data de hoje no formato "2026-05-24".

    const d = new Date(new Date().getTime() - 3 * 60 * 60 * 1000); // subtrai 3h → hora de Brasília em UTC
    const seed = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

    const [jogoInicial, setJogoInicial] = useState<{ start: string; target: string }>({ start: "", target: "" }); // valor inicial vazio, vai ser atualizado depois com o valor do banco ou sorteado

    const {
        carregando,
        voceVenceu,
        setVoceVenceu,
        historico,
        passos,
        paginaObjetivo,
        setHistorico,
        setPassos,
        setPaginaAtual,
        pontoFlutuante,
        wikiHtml,
        iniciarNovoJogo,
        setPaginaObjetivo,
        handleBotaoVoltar,
        handleNavegarPeloHistorico,
        handleLinkClicado,
    } = useGameLogic(jogoInicial.start, jogoInicial.target, seed);

    // ==== SALVA PALAVRA DO DIA NO BANCO ==== //
    useEffect(() => {
        if (!seed) return;

        async function salvarPalavraDoDiaNoBanco() {
            // TODA ESSA PARTE É IGNORADA SE JÁ EXISTEM DADOS NO LOCALSTORAGE
            // E SE

            const { data, error } = await supabase
                .from("palavras_do_dia")
                .select("id, inicial, objetivo, data")
                .eq("data", seed)
                .maybeSingle(); // Se não achar nada, retorna null.

            if (error) {
                console.error("Erro ao verificar palavra do dia no banco:", error);
                console.log("código: ", error.code);
                console.log("mensagem: ", error.message);
                console.log("detalhes: ", error.details);
                return;
            }

            if (!data) {
                const { start, target } = sortearJogo(arrPaginasIniciais, arrPaginasObjetivo, seed);
                setJogoInicial({ start, target });

                const { error } = await supabase.from("palavras_do_dia").insert({
                    inicial: start,
                    objetivo: target,
                    data: seed,
                });

                if (error) {
                    console.error("Erro ao salvar palavra do dia recém criada no banco:", error);
                } else {
                    setPaginaAtual(start);
                    setHistorico([start]);
                    setPassos(0);
                    setPaginaObjetivo(target);
                    setVoceVenceu(false);
                    console.log("Palavra do dia recém criada salva no banco com sucesso!!!");
                }
            }

            // se existem dados, e é o primeiro acesso do usuário (jogoDeHojeSalvoNoStorage.current === false)
            // carrega a palavra do dia do banco para o estado do jogo.
            // Se o usuário já acessou hoje, carrega do localStorage
            // e ignora os dados do banco
            if (data) {
                setPaginaAtual(data.inicial);
                setHistorico([data.inicial]);
                setPassos(0);
                setPaginaObjetivo(data.objetivo);
                setVoceVenceu(false);
                console.log("Segundo acesso em diante");
            }
        }

        // Não precisamos acessar o banco se o usuário já acessou e
        // já armazenou os dados do jogo no local storage,
        // porque nesse caso o progresso é carregado do storage (efeito abaixo) e
        // não queremos sobrescrever o progresso do usuário com os dados do banco.

        //já salvou a palavra do dia no banco e no localStorage
        const json = localStorage.getItem(`desafio-diario-${seed}`);
        if (json) {
            const dados = JSON.parse(json);

            if (dados.historico && dados.historico.length > 0) {
                setPaginaAtual(dados.historico[dados.historico.length - 1]);
                setHistorico(dados.historico);
                setPassos(dados.passos);
                setPaginaObjetivo(dados.objetivo);
                setVoceVenceu(dados.jaVenceu);
            }
        } else {
            salvarPalavraDoDiaNoBanco();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seed]);

    // ==== SALVA PROGRESSO A CADA MUDANÇA E PRIMEIRO ACESSO ====
    useEffect(() => {
        if (passos === 0) return; // não salva progresso se o jogo acabou de começar, para evitar sobrescrever a palavra do dia do banco com um progresso zerado.
        const dados: DadosLocalStorage = {
            historico: historico,
            objetivo: paginaObjetivo,
            passos,
            jaVenceu: voceVenceu,
        };
        console.log("Salvando progresso no localStorage render 2: ", dados);
        // seed é a data de hoje, então a chave é única por dia. Formato: "desafio-diario-2026-05-24"
        localStorage.setItem(`desafio-diario-${seed}`, JSON.stringify(dados));
    }, [historico, paginaObjetivo, passos, voceVenceu, seed]);

    return (
        <div className="min-h-screen ">
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
                    seedProp={seed}
                />
            )}

            <div>
                {/* Barra fixa com HUD de pontos, breadcrumb do histórico e objetivo */}
                <BarraSuperiorFixa
                    historico={historico}
                    passos={passos}
                    handleBotaoVoltar={handleBotaoVoltar}
                    pontoFlutuante={pontoFlutuante}
                    paginaObjetivo={paginaObjetivo}
                    handleNavegarParaHistorico={handleNavegarPeloHistorico}
                    tema={"desafio"}
                    titulo={"Desafio Diário"}
                />

                {/* Balão de ajuda */}
                {/* <div className="z-200 absolute md:top-40 top-55 left-1/2 -translate-x-1/2 min-w-max  animate-bounce ">
                    <div className="relative inline-block">
                        <p className="nes-balloon from-left nes-pointer text-sm md:text-lg   ">
                            Desafio Diário: um novo par de páginas todo dia! <br /> Vença para ver o ranking dos
                            melhores tempos.
                        </p>
                        <i className="nes-icon close is-small absolute -top-9  right-8"></i>
                    </div>
                </div> */}
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
