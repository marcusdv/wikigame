import type { Metadata } from "next";
import { Press_Start_2P } from "next/font/google";
import "./globals.css";
import "./wikiStyle.css";

const pressStart2P = Press_Start_2P({
    variable: "--font-press-start",
    subsets: ["latin"],
    weight: "400",
});
import { ToastProvider } from "@/app/components/Toast";
import DarkModeToggle from "@/app/components/DarkModeToggle";

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
        <html lang="pt-br" className={`${pressStart2P.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col">
                <ToastProvider>{children}</ToastProvider>
                <DarkModeToggle />
            </body>
        </html>
    );
}
