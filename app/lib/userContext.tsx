"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Usuario = {
    id: string;
    nome: string;
    email: string;
} | null;

const UserContext = createContext<Usuario | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);

    // O UserProvider fica no layout.tsx, que é persistente no Next.js. Então na prática roda uma vez por sessão (enquanto o usuário não der F5).
    useEffect(() => {
        fetch("/api/me")
            .then((response) => {
                // Se a resposta for bem-sucedida, retorna os dados do usuário; caso contrário, retorna null.
                return response.ok ? response.json() : null;
            })
            .then((data) => {
                // pega os dados já convertidos em JSON e atualiza o estado do usuário.
                setUsuario(data);
            })
            .catch((error) => {
                console.error("Erro ao buscar informações do usuário:", error);
            });
    }, []);

    return <UserContext.Provider value={usuario}>{children}</UserContext.Provider>;
}

export function useUsuario() {
    return useContext(UserContext);
}
