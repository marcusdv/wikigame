"use client";
import { useEffect, useState } from "react";
import { BsMoon, BsSun } from "react-icons/bs";

export default function DarkModeToggle() {
    const [dark, setDark] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("dark-mode");
        const prefereDark =
            saved !== null ? saved === "true" : window.matchMedia("(prefers-color-scheme: dark)").matches;
        setDark(prefereDark);
        document.documentElement.classList.toggle("dark", prefereDark);
    }, []);

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
