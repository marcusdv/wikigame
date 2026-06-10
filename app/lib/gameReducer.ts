export type GameState = {
    historico: string[];
    paginaAtual: string;
    pontos: number;
    paginaObjetivo: string;
    voceVenceu: boolean;
    carregando: boolean;
    custoDeVoltar: number;
};

export type GameAction =
    | { type: "NAVEGOU"; pagina: string }
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
            const ganhou =
                state.paginaAtual.toLocaleLowerCase().trim() === state.paginaObjetivo.toLocaleLowerCase().trim();
            return {
                ...state,
                historico: [...state.historico, action.pagina],
                paginaAtual: action.pagina,
                pontos: state.pontos + 1,
                voceVenceu: ganhou,
            };
        }
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
                pontos: action.pontos,
                voceVenceu: action.voceVenceu,
                carregando: false,
                custoDeVoltar: action.custoDeVoltar,
            };
        default:
            return state;
    }
}
