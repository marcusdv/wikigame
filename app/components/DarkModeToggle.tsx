"use client";
import { useSyncExternalStore } from "react";

// Estado global fora do componente — persiste entre re-renders sem useState
let initialized = false;
let darkValue = false;
const listeners: Array<() => void> = [];

// useSyncExternalStore exige uma função subscribe que registra o listener
// e retorna uma função de cleanup para removê-lo
function subscribe(callback: () => void) {
    listeners.push(callback);
    return () => {
        const index = listeners.indexOf(callback);
        if (index > -1) listeners.splice(index, 1);
    };
}

// Lê o valor atual do dark mode — chamado pelo React no cliente
// Na primeira chamada, inicializa a partir do localStorage ou preferência do sistema
function getSnapshot() {
    if (!initialized) {
        initialized = true;
        const saved = localStorage.getItem("dark-mode");
        darkValue = saved !== null ? saved === "true" : window.matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", darkValue);
    }
    return darkValue;
}

// Valor usado no servidor — sempre false para evitar hydration mismatch
function getServerSnapshot() {
    return false;
}

// Atualiza o dark mode, sincroniza o DOM e avisa o React para re-renderizar
function setDark(value: boolean) {
    darkValue = value;
    document.documentElement.classList.toggle("dark", value);
    localStorage.setItem("dark-mode", String(value));
    listeners.forEach((l) => l());
}

export default function DarkModeToggle() {
    const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

    return (
        <label
            style={{ fontSize: 8, display: "flex", alignItems: "center", gap: "8px" }}
            className="pixel-font px-3 py-2 w-full hover:bg-slate-700 cursor-pointer text-blue-500 "
        >
            <span>Dark Mode</span>
            <input
                type="checkbox"
                className="cursor-pointer"
                checked={dark}
                onChange={(e) => setDark(e.target.checked)}
            />
        </label>
    );
}
