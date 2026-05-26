import { paginas } from "@/data/paginas";
import { useEffect, useRef, useState } from "react";

// Sorteia páginas de início e objetivo sem repetição.
// Definida fora do componente para ser usada como lazy initializer do useState sem causar re-renders.
// Se passado uma seed, sortearJogo() é determinístico
function sortearJogo(seed?: string): { start: string; target: string } {
    if (seed) {
        const hash = [...seed].reduce((acc, c) => acc + c.charCodeAt(0), 0);

        const startIndex = hash % paginas.length;

        let targetIndex = (hash * 31) % paginas.length;
        // Se colidiu com startIndex, só anda uma posição pra frente
        // o módulo garante que não sai fora do array
        if (targetIndex === startIndex) {
            targetIndex = (targetIndex + 1) % paginas.length;
        }

        return { start: paginas[startIndex]!, target: paginas[targetIndex]! };
    }

    const start = paginas[Math.floor(Math.random() * paginas.length)] || "América do Sul";
    let target = paginas[Math.floor(Math.random() * paginas.length)] || "Egito";
    while (target.toLowerCase() === start.toLowerCase()) {
        target = paginas[Math.floor(Math.random() * paginas.length)] || "Egito";
    }
    return { start, target };
}

// Se passado uma seed, sortearJogo() é determinístico — ou seja, sempre retorna o mesmo par de páginas para a mesma seed.
// Utilizado par desafio diário, para que todos os jogadores recebam o mesmo par no mesmo day.
export function useGameLogic(seed?: string, podeChamarAPI: boolean = true) {
    // HTML cru retornado pela Wikipedia via nossa API. Injetado no DOM via dangerouslySetInnerHTML.
    const [wikiHtml, setWikiHtml] = useState<string>("");

    // Inicializa o jogo com uma página inicial e uma página objetivo sorteadas aleatoriamente.
    // Seguro usar lazy initialization aqui porque o componente WikiGame é renderizado apenas no cliente (ssr: false).
    // Se uma seed for passada, o jogo será o mesmo par.
    // se não, será um par aleatório a cada nova reinicialização.
    const [jogoInicial] = useState<{ start: string; target: string }>(() => sortearJogo(seed));

    // Histórico de páginas visitadas pelo jogador, usado para mostrar o breadcrumb e permitir voltar para páginas anteriores.
    // O primeiro item é sempre a página inicial sorteada, e o último item é a página atual.
    const [historico, setHistorico] = useState<string[]>([jogoInicial.start]);

    // Título da página atual do jogo. Inicializado com jogoInicial.start, que é a página sorteada.
    const [paginaAtual, setPaginaAtual] = useState<string>(historico[historico.length - 1]);
    // Titulo que o jogador deve encontrar para vencer. Inicializado com jogoInicial.target, que é a página sorteada.
    const [paginaObjetivo, setPaginaObjetivo] = useState<string>(jogoInicial.target);

    // Controla a animação de +1 / +2 que flutua sobre o placar.
    // O campo `id` muda a cada disparo para forçar o React a remontar a animação,
    // mesmo que o valor (+1 ou +2) seja igual ao da vez anterior.
    const [pontoFlutuante, setPontoFlutuante] = useState<{ id: number; valor: number } | null>(null);

    const [passos, setPassos] = useState(0);
    const [voceVenceu, setVoceVenceu] = useState(false);

    // Cortina de carregamento que aparece enquanto o HTML da Wikipedia está sendo buscado.
    const [carregando, setCarregando] = useState(false);

    const animacaoIdRef = useRef(0); // Ref para gerar IDs únicos para animações de passos flutuantes.

    useEffect(() => {
        if (voceVenceu) return; // não bloqueia depois de vencer

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            // garante compatibilidade com firefox e safari, que exigem que returnValue seja setada para mostrar o alerta de confirmação
            // foi o claude que me disse
            e.returnValue = "";
        };

        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, [voceVenceu]);

    const iniciarNovoJogo = () => {
        const { start, target } = sortearJogo(seed);
        setHistorico([start]);
        setPaginaAtual(start);
        setPaginaObjetivo(target);
        setPassos(0);
        setVoceVenceu(false);
    };

    // Toda vez que paginaAtual muda, busca o HTML da nova página via nossa API proxy.
    // O HTML é renderizado no DOM via dangerouslySetInnerHTML, e handleLinkClicado() captura cliques em links para atualizar paginaAtual sem recarregar a página.
    useEffect(() => {
        // o pronto é necessário para evitar que a página inicial seja carregada antes de o localStorage ser carregado.
        // quando pegamos a pagian do localStorage, nós fazemos a requisição com ela, depois marcamos o pronto como true.
        // sem isso, a página inicial seria carregada com a página sorteada, e logo depois recarregada com a página do localStorage, causando um flash indesejado.
        if (!paginaAtual || !podeChamarAPI) return;
        async function buscarNaApiDaWiki() {
            setCarregando(true);

            try {
                const resposta = await fetch(`/api/wiki?pagina=${encodeURIComponent(paginaAtual)}`);
                const dados = await resposta.json();

                // A API de parse da Wikipedia retorna o HTML renderizado da página dentro de dados.parse.text["*"].
                const html = dados.parse.text["*"];
                setWikiHtml(html);
            } catch (err) {
                setWikiHtml(
                    `<p class="text-center text-red-500">Erro ao carregar página: ${err instanceof Error ? err.message : "Erro desconhecido"}</p>`,
                );
            }

            setCarregando(false);
            window.scrollTo({ top: 0, behavior: "instant" });
        }

        buscarNaApiDaWiki();
    }, [paginaAtual, podeChamarAPI]);

    const handleLinkClicado = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();

        const elementoClicado = e.target;

        if (!(elementoClicado instanceof HTMLElement)) return;

        const linkPai = elementoClicado.closest("a");

        if (!linkPai || !(linkPai instanceof HTMLAnchorElement)) return;

        const href = linkPai.getAttribute("href");

        // Ignora links que não levam a artigos da Wikipedia, como links para arquivos, ajuda, ou páginas internas.
        if (
            href &&
            (href.includes("Ficheiro:") ||
                href.includes("File:") ||
                href.includes("Ajuda:") ||
                href.includes("Wikipedia:"))
        ) {
            return;
        }

        if (href && href.startsWith("/wiki/")) {
            // Exemplo do fluxo de transformação de um link:
            // 1. Link original no HTML (href): "/wiki/Am%C3%A9rica_do_Sul"
            // 2. Após .replace()           : "Am%C3%A9rica_do_Sul"
            // 3. Após decodeURIComponent() : "América_do_Sul"
            // 4. Após .replace(/_/g, " ")  : "América do Sul" (Pronto para o histórico e UI)

            const paginaClicada = decodeURIComponent(href.replace("/wiki/", "").replace(/_/g, " "));

            setPaginaAtual(paginaClicada);
            setHistorico((historicoAnterior) => [...historicoAnterior, paginaClicada]);
            setPontoFlutuante({ id: ++animacaoIdRef.current, valor: 1 });
            setPassos((passos) => passos + 1);
            checarVitoria(paginaClicada);
        }
    };

    // Des
    const handleVoltar = () => {
        if (historico.length <= 1) return; // Não volta se não houver histórico

        const historicoCopia = [...historico];
        historicoCopia.pop();

        const paginaAtual = historicoCopia[historicoCopia.length - 1];

        setHistorico(historicoCopia);
        setPaginaAtual(paginaAtual);
        setPassos((passos) => passos + 2);
        setPontoFlutuante({ id: ++animacaoIdRef.current, valor: 2 });
    };

    // ============================= NÃO ENTENDI
    // Ref que sempre aponta para a versão mais recente de handleVoltar.
    // Necessário para que os listeners registrados uma única vez nunca usem um closure desatualizado.
    const handleVoltarRef = useRef(handleVoltar);
    useEffect(() => {
        handleVoltarRef.current = handleVoltar;
    });

    // Registra Backspace (teclado) e botão lateral de voltar do mouse para acionar handleVoltar.
    // mousedown com button === 3 é o botão de voltar presente em mouses com botões extras.
    // Backspace é bloqueado se o foco estiver em um campo de texto para não interferir na digitação.
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== "Backspace") return;
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            e.preventDefault();
            handleVoltarRef.current();
        };

        const onMouseDown = (e: MouseEvent) => {
            if (e.button !== 3) return;
            e.preventDefault();
            handleVoltarRef.current();
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("mousedown", onMouseDown);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("mousedown", onMouseDown);
        };
    }, []);

    // Permite navegar pelo histórico clicando diretamente nas páginas na barra superior.
    // Ex. se o histórico for [Brasil, América do Sul, Argentina] e o jogador clicar em "América do Sul",
    // o jogo volta para essa página e o histórico vira [Brasil, América do Sul].
    // Custa 2 passos
    const handleNavegarPeloHistorico = (index: number) => {
        if (index === historico.length - 1) return; // Não navega para a página atual

        const novoHistorico = historico.slice(0, index + 1); // Inclui a página do índice selecionado
        const paginaAtual = novoHistorico[novoHistorico.length - 1]; // Nova página atual é a última do novo histórico

        setHistorico(novoHistorico);
        setPaginaAtual(paginaAtual);
        setPassos((passos) => passos + 2);
        setPontoFlutuante({ id: ++animacaoIdRef.current, valor: 2 });
    };

    // Compara a página clicada com o objetivo, ignorando maiúsculas.
    const checarVitoria = (pagina: string) => {
        if (pagina.toLowerCase() === paginaObjetivo.toLowerCase()) {
            setVoceVenceu(true);
        }
    };

    return {
        wikiHtml,
        paginaAtual,
        paginaObjetivo,
        historico,
        setHistorico,
        setPassos,
        setPaginaAtual,
        passos,
        pontoFlutuante,
        voceVenceu,
        carregando,
        setCarregando,
        iniciarNovoJogo,
        handleLinkClicado,
        handleVoltar,
        handleNavegarPeloHistorico,
        checarVitoria,
    };
}
