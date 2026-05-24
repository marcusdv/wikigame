"use client";
import dynamic from "next/dynamic";

const DesafioDiario = dynamic(() => import("./DesafioDiario"), { ssr: false });

export default function Page() {
    return <DesafioDiario />;
}
