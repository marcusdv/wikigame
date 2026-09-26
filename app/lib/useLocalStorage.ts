import { useState } from "react";

export function useLocalStorage<T>(chave: string, valorInicial: T) {
    const [valor, setValor] = useState<T>(() => {
        if (typeof window === "undefined") return valorInicial; // SSR safety

        try {
            const valorSalvo = localStorage.getItem(chave);
            return valorSalvo ? JSON.parse(valorSalvo) : valorInicial;
        } catch (error) {
            console.error("Erro ao acessar o localStorage:", error);
            return valorInicial;
        }
    });

    const salvar = (novoValor: T) => {
        try {
            setValor(novoValor);
            localStorage.setItem("chave", JSON.stringify(novoValor));
        } catch (error) {
            console.error(error);
        }
    };

    return { valor, salvar } as const;
}
