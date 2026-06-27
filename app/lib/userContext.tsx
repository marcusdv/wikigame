"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Usuario = {
    id: string;
    nome: string;
    email: string;
} | null;

type UserContextType = {
    usuario: Usuario;
    carregando: boolean;
    refreshUsuario: () => Promise<void>;
};

const UserContext = createContext<UserContextType>({ usuario: null, carregando: true, refreshUsuario: async () => {} });

export function UserProvider({ children }: { children: React.ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario>(null);
    const [carregando, setCarregando] = useState(true);

    async function refreshUsuario() {
        await fetch("/api/me")
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => setUsuario(data))
            .catch(() => console.error("Erro ao buscar usuário"))
            .finally(() => setCarregando(false));
    }

    useEffect(() => {
        refreshUsuario();
    }, []);

    return <UserContext.Provider value={{ usuario, carregando, refreshUsuario }}>{children}</UserContext.Provider>;
}

export function useUsuario() {
    return useContext(UserContext);
}
