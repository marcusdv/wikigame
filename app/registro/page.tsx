"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import BarraLogin from "@/app/components/BarraLogin";
import { useUsuario } from "../lib/userContext";

export default function Registro() {
    const router = useRouter();
    const [form, setForm] = useState({ nome: "", email: "", senha: "" });
    const [segundaSenha, setSegundaSenha] = useState("");
    const [erro, setErro] = useState("");
    const [isPending, startTransition] = useTransition();
    const [pontos, setPontos] = useState(1);
    const { refreshUsuario } = useUsuario();

    // ANIMAÇÃO DAS RETICÊNCIAS
    useEffect(() => {
        if (!isPending) return;
        const id = setInterval(() => setPontos((p) => (p >= 3 ? 1 : p + 1)), 400);
        return () => clearInterval(id);
    }, [isPending]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    // REGISTRA USUÁRIO NO BANCO SUPABASE
    function handleSubmit(formData: FormData) {
        const nome = formData.get("nome") as string;
        const email = formData.get("email") as string;
        const senha = formData.get("senha") as string;

        if (senha !== segundaSenha) {
            setErro("As senhas não coincidem");
            return;
        }

        startTransition(async () => {
            setErro("");

            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome, email, senha }),
            });

            const dados = await res.json();

            if (!res.ok) {
                setErro(dados.error ?? dados.erro ?? "Erro ao criar conta");
                return;
            }

            await refreshUsuario();
            router.push("/diario");
        });
    }

    return (
        <div className="min-h-screen flex flex-col">
            <BarraLogin />
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-sm">
                    <h1 className="pixel-font text-center text-md pb-2">Criar conta</h1>

                    <form action={handleSubmit} className="flex flex-col gap-4">
                        <div className="nes-field">
                            <label htmlFor="nome" className="pixel-font" style={{ fontSize: 8 }}>
                                Nome de usuário
                            </label>
                            <input
                                id="nome"
                                name="nome"
                                type="text"
                                className="nes-input bg-slate-800 text-white"
                                value={form.nome}
                                onChange={handleChange}
                                disabled={isPending}
                            />
                        </div>

                        <div className="nes-field">
                            <label htmlFor="email" className="pixel-font" style={{ fontSize: 8 }}>
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                className="nes-input bg-slate-800 text-white"
                                value={form.email}
                                onChange={handleChange}
                                disabled={isPending}
                            />
                        </div>

                        <div className="nes-field">
                            <label htmlFor="senha" className="pixel-font" style={{ fontSize: 8 }}>
                                Senha
                            </label>
                            <input
                                id="senha"
                                name="senha"
                                type="password"
                                className="nes-input bg-slate-800 text-white"
                                value={form.senha}
                                onChange={handleChange}
                                disabled={isPending}
                            />
                        </div>

                        <div className="nes-field">
                            <label htmlFor="senha" className="pixel-font" style={{ fontSize: 8 }}>
                                Confirmar senha
                            </label>
                            <input
                                id="segunda_senha_comparar"
                                name="segunda senha comparar"
                                type="password"
                                className="nes-input bg-slate-800 text-white"
                                value={segundaSenha}
                                onChange={(e) => setSegundaSenha(e.target.value)}
                                disabled={isPending}
                            />
                        </div>

                        {erro && (
                            <p className="pixel-font text-red-500 " style={{ fontSize: 8, marginBottom: -28 }}>
                                {erro}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="nes-btn is-primary pixel-font"
                            style={{ fontSize: 8, marginTop: 30 }}
                            disabled={isPending}
                        >
                            {isPending ? `Criando${".".repeat(pontos)}` : "Criar conta"}
                        </button>
                        <p className="pixel-font text-center" style={{ fontSize: 8 }}>
                            Já tem uma conta?{" "}
                            <a href="/login" className="text-blue-400">
                                Acessar Conta
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
