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
import Secoes from "../components/Secoes";
import { useSecoes } from "../lib/useSecoes";

type DadosLocalStorage = {
    historico: string[];
    objetivo: string;
    pontos: number;
    jaVenceu: boolean;
};

export default function DesafioDiario() {
    const d = new Date(new Date().getTime() - 3 * 60 * 60 * 1000); // pega a data de uma maneira que seja igual para todos, e subtrai 3h → hora de Brasília em UTC
    const seed = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`; // data de hoje no formato "2026-05-24".

    // para saber se renderiza balões na tela, só precisa uma vez para o jogador aprender e nunca mais
    const precisaDeBaloes = !localStorage.getItem("ja-viu-os-baloes");

    const [jogoInicial, setJogoInicial] = useState<{ start: string; target: string }>({ start: "", target: "" }); // valor inicial vazio, vai ser atualizado depois com o valor do banco ou sorteado
    const [balanEncontreAberto, setBalaoEncontreAberto] = useState<boolean>(true);
    const [saindoBalaoEncontrado, setSaindoBalaoEncontrado] = useState(false);

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
        carregarJogoExistente,
    } = useGameLogic(jogoInicial.start, jogoInicial.target);

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
                    console.log("Palavra do dia recém criada salva no banco com sucesso!!!");
                }
            }

            // se existem dados, e é o primeiro acesso do usuário (jogoDeHojeSalvoNoStorage.current === false)
            // carrega a palavra do dia do banco para o estado do jogo.
            // Se o usuário já acessou hoje, carrega do localStorage
            // e ignora os dados do banco
            if (data) {
                carregarJogoExistente(data.objetivo, [data.inicial], 0, false);
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
                carregarJogoExistente(dados.objetivo, dados.historico, dados.pontos, dados.jaVenceu);
            }
        } else {
            salvarPalavraDoDiaNoBanco();
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [seed]);

    // ==== SALVA PROGRESSO A CADA MUDANÇA E PRIMEIRO ACESSO ====
    useEffect(() => {
        if (pontos === 0) return; // não salva progresso se o jogo acabou de começar, para evitar sobrescrever a palavra do dia do banco com um progresso zerado.
        const dados: DadosLocalStorage = {
            historico: historico,
            objetivo: paginaObjetivo,
            pontos,
            jaVenceu: voceVenceu,
        };
        console.log("Salvando progresso no localStorage render 2: ", dados);
        // seed é a data de hoje, então a chave é única por dia. Formato: "desafio-diario-2026-05-24"
        localStorage.setItem(`desafio-diario-${seed}`, JSON.stringify(dados));
    }, [historico, paginaObjetivo, pontos, voceVenceu, seed]);

    // ==== REGISTRA QUE JÁ VIU O BALÃO SE FECHAR  ====
    useEffect(() => {
        if (!balanEncontreAberto) {
            localStorage.setItem("ja-viu-os-baloes", "true");
        }
    }, [balanEncontreAberto]);

    // ==== HOOK QUE PEGA AS SEÇÕES DA PAGINA ====
    // ==== E MONTA NUMA LISTA ====
    const { secoesDaPagina, irParaSecao } = useSecoes(wikiHtml);

    // ==== HANDLE PARA REMOVER BALÃO DA TELA ====
    function handleBalaoEncontreClick() {
        setSaindoBalaoEncontrado(true);
        setTimeout(() => setBalaoEncontreAberto(false), 1000); // espera a animação terminar
    }

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

            {/* Modal de vitória — aparece quando o jogador atinge o objetivo */}
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
                    tema={"desafio"}
                    titulo={"Desafio Diário"}
                />

                {/* Balão de ajuda com o objetivo */}
                {wikiHtml && precisaDeBaloes && balanEncontreAberto && (
                    <div
                        // z da barra superior é 30
                        className="z-20 absolute pixel-font top-70 md:top-55 left-1/2 -translate-x-1/2 w-9/10 md:w-5/12"
                    >
                        <div
                            onClick={handleBalaoEncontreClick}
                            className={`
                                            nes-balloon 
                                            from-left nes-pointer 
                                            animate__animated ${saindoBalaoEncontrado ? "animate__zoomOutLeft " : "animate__pulse animate__infinite animate__slow "} 
                                    `}
                        >
                            <span className="absolute right-0 top-0 text-gray-600"> X</span>
                            <p className="" style={{ fontSize: 10 }}>
                                Encontre a página{" "}
                                <span className="text-md uppercase text-orange-800 font-extrabold  bg-amber-300 px-2 py-1 rounded">
                                    {paginaObjetivo}
                                </span>{" "}
                                <br />
                                Mas só navegando pelos links da página! <br /> BOA SORTE!!!{" "}
                                <i className="nes-icon heart is-small"></i>
                            </p>
                            <p className="text-center text-gray-500" style={{ fontSize: 9 }}>
                                - clique para fechar -
                            </p>
                        </div>
                    </div>
                )}

                <Secoes secoesDaPagina={secoesDaPagina} irParaSecao={irParaSecao} />

                {/* Container do artigo. Delegamos cliques aqui para capturar qualquer link filho. */}
                <div
                    onClick={handleLinkClicado}
                    id="wikicontent"
                    className="my-3 px-4 sm:px-8 py-6 max-w-7xl mx-auto bg-white shadow-xl min-h-screen"
                    dangerouslySetInnerHTML={{ __html: wikiHtml }}
                />

                <Footer historico={historico} pontos={pontos} />
            </div>
        </div>
    );
}
