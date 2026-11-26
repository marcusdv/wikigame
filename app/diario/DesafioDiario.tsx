"use client";
import { useGameLogic } from "../lib/useGameLogic";
import BarraSuperiorFixa from "../components/BarraSuperiorFixa";
import Footer from "../components/Footer";
import VoceVenceu from "../components/VoceVenceuTela";
import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { dataEmBrasilia } from "../lib/dataBrasilia";
import LinkSelect from "../components/LinkSelect";
import { useUsuario } from "../lib/userContext";
import { useToast } from "../components/Toast";

type DadosLocalStorage = {
    historico: string[];
    objetivo: string;
    pontos: number;
    custoDeVoltar: number;
    voceVenceu: boolean;
};

export default function DesafioDiario() {
    // Data de hoje em Brasília ("2026-11-26"): chave do progresso no localStorage e dia do recorde.
    const seed = dataEmBrasilia();

    const [idPalavraDoDia, setIdPalavraDoDia] = useState<number | null>(null);
    const { usuario } = useUsuario();
    const { mostrarErro } = useToast();

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
    } = useGameLogic("", ""); // começa vazio; o efeito abaixo carrega o jogo do dia

    // ==== CARREGA O JOGO DO DIA ==== //
    //
    // ANTES: se o navegador não achasse a palavra do dia no banco, ELE sorteava e gravava com a
    // chave pública (anon). Qualquer pessoa podia gravar a palavra de amanhã antes de todo mundo.
    //
    // AGORA:
    // 1. Se já existe progresso de hoje no localStorage, carrega ele (não perde o que a pessoa já jogou).
    // 2. SEMPRE pergunta ao servidor qual é a palavra do dia (GET /api/palavra-do-dia). O servidor
    //    devolve a linha de hoje ou, se ainda não existir, sorteia e grava (ver app/api/palavra-do-dia/route.ts).
    //    - o `id` é guardado: o efeito "já venceu" e o ranking precisam dele;
    //    - se não havia progresso salvo, o jogo começa com as páginas que vieram do servidor.
    useEffect(() => {
        // ---- 1. progresso salvo de hoje? ----
        let temProgressoSalvo = false;
        try {
            const json = localStorage.getItem(`desafio-diario-${seed}`);
            const dados: DadosLocalStorage | null = json ? JSON.parse(json) : null;
            if (dados?.historico && dados.historico.length > 0) {
                carregarJogoExistente(
                    dados.objetivo,
                    dados.historico,
                    dados.pontos,
                    dados.voceVenceu ?? false,
                    dados.custoDeVoltar,
                );
                temProgressoSalvo = true;
            }
        } catch {
            // localStorage bloqueado ou JSON corrompido: segue como se não houvesse progresso.
        }

        // ---- 2. palavra do dia, pelo servidor ----
        fetch("/api/palavra-do-dia")
            .then(async (resposta) => {
                const dados = await resposta.json();
                if (!resposta.ok) throw new Error(dados.error ?? `Status ${resposta.status}`);

                setIdPalavraDoDia(dados.id);
                // Sem progresso salvo: começa o jogo do dia do zero.
                if (!temProgressoSalvo) iniciarNovoJogo(dados.inicial, dados.objetivo);
            })
            .catch((err) => {
                // Mostra o erro na tela em vez de deixar o diário em branco sem explicação.
                mostrarErro(err instanceof Error ? err.message : "Erro ao carregar o desafio do dia");
            });
    }, [seed, carregarJogoExistente, iniciarNovoJogo, mostrarErro]);

    // ==== VERIFICA SE USUARIO JÁ VENCEU O JOGO ====
    // Se o usuário logado já tem recorde neste desafio (ex.: venceu em outro aparelho),
    // mostra a tela de vitória com os pontos do banco.
    //
    // ANTES este efeito tinha `historico`, `paginaObjetivo`, `custoDeVoltar` e
    // `carregarJogoExistente` nas dependências. A função era recriada a cada render, então o
    // efeito rodava em TODO render: achava o recorde → dispatch → novo render → efeito de novo →
    // nova consulta... um loop de consultas ao Supabase para quem já tinha vencido.
    //
    // AGORA:
    // - `carregarJogoExistente` é estável (useCallback no useGameLogic);
    // - os valores do jogo são lidos de uma ref (`jogoRef`), sem entrar nas dependências;
    // - `jaConferiuVitoria` garante uma consulta só por usuário e desafio.
    const jogoRef = useRef({ paginaObjetivo, historico, custoDeVoltar });
    useEffect(() => {
        // Mantém a ref com os valores mais recentes (roda depois de cada render).
        jogoRef.current = { paginaObjetivo, historico, custoDeVoltar };
    });

    const jaConferiuVitoria = useRef(false);
    useEffect(() => {
        if (!usuario || !idPalavraDoDia) return; // espera saber quem é o usuário e qual é o desafio
        if (jaConferiuVitoria.current) return; // já consultou: não repete
        jaConferiuVitoria.current = true;

        supabase
            .from("recordes")
            .select("pontos")
            .eq("id_usuario", usuario.id)
            .eq("id_palavra_do_dia", idPalavraDoDia)
            .maybeSingle()
            .then(({ data }) => {
                if (data) {
                    // já venceu — carrega o estado de vitória com os valores atuais do jogo
                    const { paginaObjetivo, historico, custoDeVoltar } = jogoRef.current;
                    carregarJogoExistente(paginaObjetivo, historico, data.pontos, true, custoDeVoltar);
                }
            });
    }, [usuario, idPalavraDoDia, carregarJogoExistente]);

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
