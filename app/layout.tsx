import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import "./wikiStyle.css";
import { UserProvider } from "./lib/userContext";

const pressStart2P = Press_Start_2P({
    variable: "--font-press-start",
    subsets: ["latin"],
    weight: "400",
});
import { ToastProvider } from "@/app/components/Toast";

export const metadata: Metadata = {
    title: "Wikirun",
    description: "Pule pelas páginas da wikipédia",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pt-br" className={`${pressStart2P.variable} h-full antialiased`} suppressHydrationWarning>
            <head>
                <script
                    // garantir que o modo escuro seja aplicado antes do conteúdo ser renderizado.
                    dangerouslySetInnerHTML={{
                        __html: `
                            const saved = localStorage.getItem("dark-mode");
                            const prefereDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                            if (saved === "true" || (saved === null && prefereDark)) {
                                document.documentElement.classList.add("dark");
                            }
                        `,
                    }}
                />
            </head>

            <body className="min-h-full flex flex-col">
                <UserProvider>
                    <ToastProvider>{children}</ToastProvider>
                </UserProvider>
            </body>
        </html>
    );
}
