"use client";
import { useEffect, useState } from "react";
import { BsMoon, BsSun } from "react-icons/bs";

export default function DarkModeToggle() {
    const [dark, setDark] = useState(() => {
        if (typeof window === "undefined") return false;
        const jaSalvouModo = localStorage.getItem("dark-mode");
        return jaSalvouModo !== null
            ? jaSalvouModo === "true" // pega do localStorage, se tiver
            : window.matchMedia("(prefers-color-scheme: dark)").matches; // pega a preferência do sistema do usuário
    });

    useEffect(() => {
        document.documentElement.classList.toggle("dark", dark);
    }, [dark]);

    const toggle = () => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("dark-mode", String(next));
    };

    return (
        <button
            onClick={toggle}
            title={dark ? "Modo claro" : "Modo escuro"}
            style={{
                position: "fixed",
                bottom: "10px",
                left: "10px",
                zIndex: 9999,
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: "20px",
                opacity: 0.5,
                lineHeight: 1,
                padding: "4px",
            }}
        >
            {dark ? <BsSun /> : <BsMoon />}
        </button>
    );
}
