"use client";

import dynamic from "next/dynamic";

const DesafioNormal = dynamic(() => import("./DesafioNormal"), { ssr: false });

export default function Page() {
    return <DesafioNormal />;
}
