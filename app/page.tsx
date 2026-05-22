"use client";

import { useEffect, useState } from "react";

export default function Home() {
    const [wikiHtml, setWikiHtml] = useState<string>("Carregando...............");
    const [paginaAtual, setPaginaAtual] = useState("Brasil");
    const [historico, setHistorico] = useState<string[]>([paginaAtual]);
    const [pontos, setPontos] = useState<number>(0);
    // Guarda o ID da animação (para ele rodar várias vezes seguidas) e o Valor (+1, +2)
    const [pontoFlutuante, setPontoFlutuante] = useState<{ id: number; valor: number } | null>(null);

    useEffect(() => {
        // busca na api apartir do link
        async function buscarNaApiDaWiki() {
            try {
                const resposta = await fetch(`/api/wikipedia?pagina=${paginaAtual}`);
                const dados = await resposta.json();

                const textoHtml = dados.parse.text["*"];
                setWikiHtml(textoHtml);
            } catch (erro) {
                setWikiHtml("Ops, erro aqui parça...");
            }
        }
        // executa
        buscarNaApiDaWiki();
    }, [paginaAtual]);

    const handleLinkClicado = (evento: React.MouseEvent<HTMLDivElement>) => {
        evento.preventDefault();
        const elementoClicado = evento.target;
        console.log(elementoClicado);

        if (!(elementoClicado instanceof HTMLElement)) return; // se não for elemento html, retorna antes
        const link = elementoClicado.closest("A"); // tenta achar uma tag pai que seja um link
        if (!link || !(link instanceof HTMLAnchorElement)) return; // se não for um link, ou não for uma elemento <a>

        const href = link.getAttribute("href");

        // Se o link for para um Ficheiro (imagem), Categoria ou Ajuda, nós ignoramos!
        if (
            href &&
            (href.includes("Ficheiro:") ||
                href.includes("File:") ||
                href.includes("Ajuda:") ||
                href.includes("Wikipedia:"))
        ) {
            console.log("Clique bloqueado: É uma página de sistema ou imagem.");
            return;
        }

        if (href && href.startsWith("/wiki/")) {
            let paginaDestino = href.replace("/wiki/", ""); // remove o /wiki da frente
            paginaDestino = decodeURIComponent(paginaDestino); // decodifica, para as acentuações, ç, etc....
            console.log(paginaDestino);
            setHistorico([...historico, paginaDestino]);
            setPaginaAtual(paginaDestino);
            setPontos((pontos) => pontos + 1);
            // DISPARA A ANIMAÇÃO DO +1
            setPontoFlutuante({ id: Date.now(), valor: 1 });
        }
    };

    const handleVoltar = () => {
        if (historico.length < 1) return; // historico vazio? retorna

        const copiaDoHistorico = [...historico];
        const ultimaPagina = copiaDoHistorico.pop();

        setPaginaAtual(copiaDoHistorico[copiaDoHistorico.length - 1] || "");
        setHistorico(copiaDoHistorico);
        setPontos((pontos) => pontos + 2);
        // DISPARA A ANIMAÇÃO DO +1
        setPontoFlutuante({ id: Date.now(), valor: 2 });
    };

    return (
        <div>
            {/* BARRA SUPERIOR FIXA (Header do Jogo) */}
            <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-300 p-4 flex justify-between items-center shadow-md">
                {/* Lado Esquerdo: Botão de Voltar */}
                <div className="relative inline-block mt-2">
                    <>
                        {/* A etiqueta reclinada de custo (Fica na frente pelo z-10) */}
                        <div className="absolute -top-4 -right-4 rotate-12 bg-red-500 text-white text-xs font-black px-2.5 py-0.5 rounded-md shadow-md z-10 border-2 border-white pointer-events-none">
                            +2
                        </div>

                        {/* O botão principal  */}
                        <button
                            onClick={handleVoltar}
                            disabled={historico.length <= 1}
                            className={` 
                              ${historico.length <= 1 ? "bg-gray-500 hover:bg-gray-400" : "bg-green-600 cursor-pointer hover:bg-green-700"} 
                              relative  px-5 py-2   text-white font-semibold rounded-lg transition-all flex items-center  shadow-sm `}
                        >
                            ◀️ Voltar
                            <span className="text-xs opacity-80 bg-green-800/50 px-2 py-1 rounded-md ml-1 truncate flex items-center gap-1">
                                {/* Se tem mais de 4 itens no histórico, só apresenta os últimos 5
                            Se tem menos, mostra todo o histórico
                            por fim,  mapeia todos para pegar o último e aplicar uma estilização */}
                                {(historico.length > 4 ? historico.slice(-5) : historico).map((item, index, arr) => {
                                    const ehOUltimo = index === arr.length - 1;

                                    return (
                                        <span key={index} className="flex items-center">
                                            {/* O termo do histórico com estilo condicional se for o último */}
                                            <span className={ehOUltimo ? "font-bold text-yellow-400 underline" : ""}>
                                                {item}
                                            </span>

                                            {/* Adiciona a barra "/" apenas se NÃO for o último elemento */}
                                            {!ehOUltimo && <span className="mx-1 text-gray-400">/</span>}
                                        </span>
                                    );
                                })}
                            </span>
                        </button>
                    </>
                </div>

                {/* Lado Direito: Placar de Pontos */}
                <div className="flex items-center gap-3 bg-gray-100 pr-2 pl-4 py-1.5 rounded-full border border-gray-200 shadow-inner relative">
                    <span className="text-gray-600 font-bold uppercase tracking-wider text-sm">Pontos</span>

                    <div className="relative">
                        {/* Ponto Atual */}
                        <div className="bg-amber-400 text-amber-950 font-black text-xl px-4 py-1 rounded-full shadow-sm">
                            {pontos}
                        </div>
                        {/* A MÁGICA: O número flutuante que sobe e some */}
                        {pontoFlutuante && (
                            <div
                                key={pontoFlutuante.id}
                                className="absolute left-0 right-0 text-center font-black text-amber-500 text-xl pointer-events-none animate-float-up drop-shadow-md z-50"
                            >
                                +{pontoFlutuante.valor}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* CONTEÚDO DA WIKIPEDIA (Com um padding extra no topo para o Header não cobrir o texto) */}
            <div
                onClick={handleLinkClicado}
                className="p-8 max-w-5xl mx-auto bg-white shadow-xl min-h-screen"
                dangerouslySetInnerHTML={{ __html: wikiHtml }}
            />
            {/* FOOTER DO JOGO */}
            <footer className="bg-gray-950 text-gray-400 border-t border-gray-800 mt-12 transition-all">
                <div className="max-w-5xl mx-auto px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm">
                    {/* Lado Esquerdo: Identidade / Dev */}
                    <div className="flex items-center gap-2">
                        <span className="text-green-400 font-mono font-bold animate-pulse">&lt;/&gt;</span>
                        <p className="font-medium tracking-wide">
                            WikiGame <span className="text-gray-600">|</span>{" "}
                            <span className="text-gray-300 font-mono">v1.0.0</span>
                        </p>
                    </div>

                    {/* Centro: Estatísticas rápidas da partida atual */}
                    <div className="flex items-center gap-6 bg-gray-900/60 border border-gray-800/80 px-4 py-2 rounded-xl text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">Cliques:</span>
                            <span className="text-white font-bold">{historico.length - 1}</span>
                        </div>
                        <span className="text-gray-700">|</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-gray-500">Último nó:</span>
                            <span className="text-yellow-400 font-bold truncate max-w-[120px]">
                                {historico[historico.length - 1] || "Início"}
                            </span>
                        </div>
                    </div>

                    {/* Lado Direito: Créditos e Links */}
                    <div className="flex items-center gap-4 text-xs">
                        <span className="text-gray-600 font-mono">Criado por Marcus</span>
                        <a
                            href="https://shre.ink/7lQx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg border border-gray-800 transition-all flex items-center gap-1 hover:border-gray-700"
                        >
                            💻 Portfólio
                        </a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
