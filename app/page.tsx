"use client";

import dynamic from "next/dynamic";

// ssr: false impede que o componente seja renderizado no servidor.
// Necessário porque WikiGame usa Math.random() para sortear páginas —
// valores diferentes entre servidor e cliente causariam erro de hidratação.
const WikiGame = dynamic(() => import("./components/WikiGame"), { ssr: false });

export default function Page() {
    return <WikiGame />;
}
