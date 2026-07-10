"use client";
import { useGameLogic } from "../lib/useGameLogic";
import BarraSuperiorFixa from "../components/BarraSuperiorFixa";
import Footer from "../components/Footer";
import VoceVenceu from "../components/VoceVenceuTela";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { sortearJogo } from "../lib/sortearJogo";
import { arrPaginasIniciais } from "../dados/paginasIniciais";
import { arrPaginasObjetivo } from "../dados/paginasObjetivo";
import LinkSelect from "../components/LinkSelect";
import { useUsuario } from "../lib/userContext";

type DadosLocalStorage = {
    historico: string[];
    objetivo: string;
    pontos: number;
    custoDeVoltar: number;
    voceVenceu: boolean;
};

export default function DesafioDiario() {
    const d = new Date(new Date().getTime() - 3 * 60 * 60 * 1000); // pega a data de uma maneira que seja igual para todos, e subtrai 3h → hora de Brasília em UTC
    const seed = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`; // data de hoje no formato "2026-05-24".

    const [jogoInicial, setJogoInicial] = useState<{ start: string; target: string }>({ start: "", target: "" }); // valor inicial vazio, vai ser atualizado depois com o valor do banco ou sorteado

    const [idPalavraDoDia, setIdPalavraDoDia] = useState<number | null>(null);
    const { usuario } = useUsuario();

    const {
        carregando,
        voceVenceu,
        historico,
        pontos,
        paginaObjetivo,
        pontoFlutuante,
        wikiHtml,
        iniciarNovoJogo,
        handleBotaoVoltar,
        handleNavegarPeloHistorico,
        handleLinkClicado,
        custoDeVoltar,
        carregarJogoExistente,
    } = useGameLogic(jogoInicial.start, jogoInicial.target);

    // ==== SALVA PALAVRA DO DIA NO BANCO OU BUSCA A PALAVRA DO DIA ==== //
    useEffect(() => {
        if (!seed) return;

        async function salvarPalavraDoDiaNoBanco() {
            // TODA ESSA PARTE É IGNORADA SE JÁ EXISTEM DADOS NO LOCALSTORAGE
            // E SE O USUÁRIO JÁ ACESSOU O JOGO HOJE (JOGO DE HOJE SALVO NO STORAGE)

            const { data, error } = await supabase
                .from("palavras_do_dia")
                .select("id, inicial, objetivo, data")
                .eq("data", seed)
                .maybeSingle(); // Se não achar nada, retorna null.

            if (error) {
                console.log("Erro ao verificar palavra do dia no banco:", error);
                console.log("código: ", error.code);
                console.log("mensagem: ", error.message);
                console.log("detalhes: ", error.details);
                return;
            }

            // NOVO JOGO DO DIA É GERADO CASO NÃO EXISTA
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
                    iniciarNovoJogo(start, target);
                }
            }

            // se existem dados, e é o primeiro acesso do usuário (jogoDeHojeSalvoNoStorage.current === false)
            // carrega a palavra do dia do banco para o estado do jogo.
            // Se o usuário já acessou hoje, carrega do localStorage
            // e ignora os dados do banco
            if (data) {
                carregarJogoExistente(data.objetivo, [data.inicial], 0, false, 0);
                setIdPalavraDoDia(data.id);
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
                carregarJogoExistente(
                    dados.objetivo,
                    dados.historico,
                    dados.pontos,
                    dados.voceVenceu ?? false,
                    dados.custoDeVoltar,
                );
            }
        } else {
            salvarPalavraDoDiaNoBanco();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seed]);

    // ==== BUSCA O ID DA PALAVRA DO DIA (sempre, independente do localStorage) ====
    useEffect(() => {
        supabase
            .from("palavras_do_dia")
            .select("id")
            .eq("data", seed)
            .maybeSingle()
            .then(({ data }) => {
                if (data) setIdPalavraDoDia(data.id);
            });
    }, [seed]);

    // ==== VERIFICA SE USUARIO JÁ VENCEU O JOGO ====
    useEffect(() => {
        if (!usuario || !idPalavraDoDia) return;

        supabase
            .from("recordes")
            .select("pontos")
            .eq("id_usuario", usuario.id)
            .eq("id_palavra_do_dia", idPalavraDoDia)
            .maybeSingle()
            .then(({ data }) => {
                if (data) {
                    // já venceu — carrega o estado de vitória
                    carregarJogoExistente(paginaObjetivo, historico, data.pontos, true, custoDeVoltar);
                }
            });
    }, [usuario, idPalavraDoDia, paginaObjetivo, historico, custoDeVoltar, carregarJogoExistente]);

    // ==== SALVA PROGRESSO A CADA MUDANÇA E PRIMEIRO CLIQUE EM LINK ====
    useEffect(() => {
        if (pontos === 0) return; // não salva progresso se o jogo acabou de começar, para evitar sobrescrever a palavra do dia do banco com um progresso zerado.
        const dados: DadosLocalStorage = {
            historico: historico,
            objetivo: paginaObjetivo,
            pontos,
            custoDeVoltar,
            voceVenceu,
        };
        // seed é a data de hoje, então a chave é única por dia. Formato: "desafio-diario-2026-05-24"
        localStorage.setItem(`desafio-diario-${seed}`, JSON.stringify(dados));
    }, [historico, paginaObjetivo, pontos, custoDeVoltar, voceVenceu, seed]);

    return (
        <div className="min-h-screen relative">
            {/* Cortina semitransparente que bloqueia interação enquanto a página carrega */}
            {carregando && (
                <div className="fixed inset-0 z-999 bg-slate-950/20 backdrop-blur-2xs flex items-center justify-center">
                    <div className="bg-slate-900/90 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800">
                        <span className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></span>
                        <span className="text-xs font-bold tracking-wide">Carregando conteúdo...</span>
                    </div>
                </div>
            )}

            {voceVenceu && <VoceVenceu historico={historico} pontos={pontos} modoDeJogo={"diario"} seedProp={seed} />}

            <div>
                {/* Barra fixa com HUD de pontos, breadcrumb do histórico e objetivo */}
                <BarraSuperiorFixa
                    historico={historico}
                    pontos={pontos}
                    handleBotaoVoltar={handleBotaoVoltar}
                    pontoFlutuante={pontoFlutuante}
                    paginaObjetivo={paginaObjetivo}
                    handleNavegarParaHistorico={handleNavegarPeloHistorico}
                    modoDeJogo={"jogoDiario"}
                    custoDeVoltar={custoDeVoltar}
                    titulo={"Desafio Diário"}
                />

                {/* NAVEGAR PELA PÁGINA DO CONTEÚDO DA WIKI */}
                <LinkSelect wikiHtml={wikiHtml} titulo={historico[historico.length - 1] ?? ""} />

                {/* Container do artigo. Delegamos cliques aqui para capturar qualquer link filho. */}
                {wikiHtml ? (
                    <div
                        onClick={handleLinkClicado}
                        id="wikicontent"
                        className="my-3 px-4 sm:px-8 py-6 max-w-7xl mx-auto bg-white shadow-xl min-h-screen"
                        dangerouslySetInnerHTML={{ __html: wikiHtml }}
                    />
                ) : (
                    <div className="min-h-screen" />
                )}

                <Footer historico={historico} pontos={pontos} />
            </div>
        </div>
    );
}
