"use client";

import dynamic from "next/dynamic";

// ssr: false — impede que o Next.js renderize DesafioNormal no servidor.
// Necessário porque useGameLogic chama Math.random() para sortear as páginas.
// Se renderizasse no servidor, o par sorteado seria diferente do que o cliente
// recalcularia na hidratação, causando erro de hydration mismatch do React.
const DesafioNormal = dynamic(() => import("./DesafioAleatorio"), { ssr: false });

export default function Page() {
    return <DesafioNormal />;
}
