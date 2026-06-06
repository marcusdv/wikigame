"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

// Duração em ms que o toast fica visível antes de desaparecer
const DURACAO = 5000;

// Canal global que carrega a função mostrarErro para qualquer componente dentro do ToastProvider.
// O valor padrão (função vazia) é usado se alguém chamar useToast() fora do provider.
const ToastContext = createContext<{ mostrarErro: (msg: string) => void }>({
    mostrarErro: () => {},
});

// Componente isolado para a barra de progresso.
// Fica separado do ToastProvider de propósito: o setInterval roda ~60x por segundo,
// e se estivesse no provider causaria re-render do app inteiro a cada tick.
// Aqui, só a barra re-renderiza.
function BarraProgresso() {
    const [progresso, setProgresso] = useState(100); // começa em 100% e vai até 0%

    useEffect(() => {
        const inicio = Date.now();

        // Atualiza a largura da barra a cada ~16ms (~60fps)
        const intervalo = setInterval(() => {
            const passado = Date.now() - inicio;
            const restante = Math.max(0, 100 - (passado / DURACAO) * 100);
            setProgresso(restante);
            if (restante === 0) clearInterval(intervalo);
        }, 16);

        // Limpeza: cancela o intervalo se o componente desmontar antes de terminar
        return () => clearInterval(intervalo);
    }, []); // [] = roda só na montagem. O key={toast.id} no pai garante remontagem a cada novo erro.

    return (
        <div className="h-1 bg-red-800">
            {/* largura controlada pelo estado progresso */}
            <div className="h-full bg-white" style={{ width: `${progresso}%` }} />
        </div>
    );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    // null = toast invisível. { id, msg } = toast visível com aquela mensagem.
    // O id é o timestamp da criação — usado como key para forçar remontagem da BarraProgresso.
    const [toast, setToast] = useState<{ id: number; msg: string } | null>(null);

    // useCallback garante referência estável para mostrarErro entre renders,
    // evitando re-renders desnecessários nos filhos que consomem o context.
    const mostrarErro = useCallback((msg: string) => {
        setToast({ id: Date.now(), msg });
    }, []);

    // Fecha o toast automaticamente após DURACAO ms.
    // Toda vez que toast muda (novo erro), o efeito cancela o timer anterior e cria um novo.
    useEffect(() => {
        if (!toast) return;
        const timeout = setTimeout(() => setToast(null), DURACAO);
        return () => clearTimeout(timeout); // cancela se um novo erro chegar antes do tempo
    }, [toast]);

    return (
        <ToastContext.Provider value={{ mostrarErro }}>
            {children}

            {/* Renderiza o toast apenas quando há mensagem */}
            {toast && (
                <div className="fixed bottom-4 right-4 z-50 w-72 rounded-lg bg-red-600 text-white shadow-lg overflow-hidden">
                    <div className="px-4 text-center py-3 text-md font-medium whitespace-pre-wrap">{toast.msg}</div>
                    {/* key={toast.id} faz o React desmontar e remontar a BarraProgresso a cada novo erro,
                        resetando o timer interno dela do zero */}
                    <BarraProgresso key={toast.id} />
                </div>
            )}
        </ToastContext.Provider>
    );
}

// Atalho para consumir o context — evita importar ToastContext diretamente em cada arquivo
export function useToast() {
    return useContext(ToastContext);
}
