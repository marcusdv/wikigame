import { valeVitoria } from "./titulos";

export type GameState = {
    historico: string[];
    paginaAtual: string;
    pontos: number;
    paginaObjetivo: string;
    // Título oficial e apelidos do objetivo, vindos da Wikipedia no início da partida
    // (ex.: objetivo "Avalanche" → ["Avalanche", "Avalancha", "Alude", ...]). Vazio até a resposta chegar.
    nomesDoObjetivo: string[];
    voceVenceu: boolean;
    carregando: boolean;
    custoDeVoltar: number;
};

export type GameAction =
    // `pagina`: título VERDADEIRO da página que abriu (ex.: "Estados Unidos").
    // `nomeDoLink`: nome do link que o jogador clicou (ex.: "EUA").
    | { type: "NAVEGOU"; pagina: string; nomeDoLink: string }
    // Chegou a lista de nomes do objetivo. `objetivo` serve para ignorar respostas atrasadas de outra partida.
    | { type: "NOMES_DO_OBJETIVO"; objetivo: string; nomes: string[] }
    | { type: "CLICOU_NUM_LINK"; pagina: string }
    | { type: "ERRO_AO_BUSCAR_PAGINA_ATUAL" }
    | { type: "VOLTOU" }
    | { type: "VOLTOU_PELO_HISTORICO"; index: number }
    | { type: "CARREGANDO"; valor: boolean }
    | {
          type: "NOVO_JOGO";
          start: string;
          target: string;
      }
    | {
          type: "CARREGAR_JOGO_EXISTENTE";
          target: string;
          historico: string[];
          pontos: number;
          voceVenceu: boolean;
          custoDeVoltar: number;
      };

export function gameReducer(state: GameState, action: GameAction) {
    switch (action.type) {
        case "NAVEGOU": {
            // Só chega aqui DEPOIS que a página carregou e apareceu na tela (ver useGameLogic).
            //
            // VITÓRIA: vale o objetivo + título oficial + apelidos (nomesDoObjetivo). O jogador vence se:
            //   - o NOME DO LINK clicado estiver na lista (ex.: objetivo "Avalanche", clicou em "Avalanche"); ou
            //   - o TÍTULO da página que abriu estiver na lista (ex.: objetivo "Humano", clicou em
            //     "Homo sapiens" e abriu "Humano"; ou objetivo "Avalanche", abriu "Avalancha").
            // Se a lista ainda não chegou (ou falhou), vale pelo menos o próprio objetivo.
            const ganhou = valeVitoria(
                [state.paginaObjetivo, ...state.nomesDoObjetivo],
                action.pagina,
                action.nomeDoLink,
            );
            return {
                ...state,
                // O histórico guarda o título verdadeiro ("Estados Unidos"), que é a página que o jogador viu.
                historico: [...state.historico, action.pagina],
                // paginaAtual NÃO muda: continua o nome do link ("EUA"). Se mudasse para "Estados Unidos",
                // o efeito de busca do useGameLogic rodaria de novo e baixaria a mesma página duas vezes.
                pontos: state.pontos + 1,
                voceVenceu: ganhou,
            };
        }
        case "NOMES_DO_OBJETIVO":
            // Resposta de uma partida anterior (o objetivo mudou no meio do caminho): ignora.
            if (action.objetivo !== state.paginaObjetivo) return state;
            return {
                ...state,
                nomesDoObjetivo: action.nomes,
            };
        case "ERRO_AO_BUSCAR_PAGINA_ATUAL":
            return {
                ...state,
                paginaAtual: state.historico[state.historico.length - 1],
            };
        case "CLICOU_NUM_LINK":
            return {
                ...state,
                paginaAtual: action.pagina,
            };
        case "VOLTOU": {
            const copiaHistorico = [...state.historico];
            copiaHistorico.pop();
            return {
                ...state,
                historico: copiaHistorico,
                paginaAtual: copiaHistorico[copiaHistorico.length - 1],
                pontos: state.pontos + state.custoDeVoltar,
                custoDeVoltar: Math.min(state.custoDeVoltar + 1, 2),
            };
        }
        case "VOLTOU_PELO_HISTORICO": {
            const novoHistorico = state.historico.slice(0, action.index + 1);
            return {
                ...state,
                historico: novoHistorico,
                paginaAtual: novoHistorico[novoHistorico.length - 1],
                pontos: state.pontos + state.custoDeVoltar,
                custoDeVoltar: Math.min(state.custoDeVoltar + 1, 2),
            };
        }
        case "CARREGANDO":
            return {
                ...state,
                carregando: action.valor,
            };
        case "NOVO_JOGO":
            return {
                historico: [action.start],
                paginaAtual: action.start,
                paginaObjetivo: action.target,
                // Mesmo objetivo: mantém a lista já buscada. Objetivo novo: zera (o useGameLogic busca de novo).
                nomesDoObjetivo: action.target === state.paginaObjetivo ? state.nomesDoObjetivo : [],
                pontos: 0,
                voceVenceu: false,
                carregando: false,
                custoDeVoltar: 0,
            };
        case "CARREGAR_JOGO_EXISTENTE":
            return {
                historico: action.historico,
                paginaAtual: action.historico[action.historico.length - 1],
                paginaObjetivo: action.target,
                // Mesma regra do NOVO_JOGO: não perde a lista se o objetivo não mudou.
                nomesDoObjetivo: action.target === state.paginaObjetivo ? state.nomesDoObjetivo : [],
                pontos: action.pontos,
                voceVenceu: action.voceVenceu,
                carregando: false,
                custoDeVoltar: action.custoDeVoltar,
            };
        default:
            return state;
    }
}
