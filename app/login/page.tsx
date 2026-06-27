"use client";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import BarraLogin from "@/app/components/BarraLogin";

export default function Login() {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", senha: "" });
    const [erro, setErro] = useState("");
    const [isPending, startTransition] = useTransition();
    const [reticencias, setReticencias] = useState(1);

    useEffect(() => {
        if (!isPending) return;
        const id = setInterval(() => setReticencias((p) => (p >= 3 ? 1 : p + 1)), 400);
        return () => clearInterval(id);
    }, [isPending]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function handleSubmit(formData: FormData) {
        const email = formData.get("email") as string;
        const senha = formData.get("senha") as string;

        startTransition(async () => {
            setErro("");

            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, senha }),
            });

            const dados = await res.json();

            if (!res.ok) {
                setErro(dados.error ?? "Erro ao fazer login");
                return;
            }

            router.push("/diario");
        });
    }

    return (
        <div className="min-h-screen flex flex-col">
            <BarraLogin />
            <div className="flex-1 flex items-center justify-center px-4">
                <div className="w-full max-w-sm">
                    <h1 className="pixel-font text-center text-md pb-2">Login</h1>

                    <form action={handleSubmit} className="flex flex-col gap-4">
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

                        {erro && (
                            <p className="pixel-font text-red-500" style={{ fontSize: 8 }}>
                                {erro}
                            </p>
                        )}

                        <button
                            type="submit"
                            className="nes-btn is-primary pixel-font mt-2"
                            style={{ fontSize: 8 }}
                            disabled={isPending}
                        >
                            {isPending ? `Entrando${".".repeat(reticencias)}` : "Entrar"}
                        </button>

                        <p className="pixel-font text-center" style={{ fontSize: 8 }}>
                            Não tem conta?{" "}
                            <a href="/registro" className="text-blue-400">
                                Criar conta
                            </a>
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}
