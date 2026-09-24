export default function ComoJogarModal({ onClose }: { onClose: () => void }) {
    localStorage.getItem("naoMostrarMaisComoJogarModal") === "true" && onClose();
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow-lg max-w-md w-full relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    &times;
                </button>
                <h2 className="text-xl font-bold mb-4">Como Jogar</h2>
                <p className="mb-4">
                    O objetivo do jogo é chegar na página objetivo da Wikipédia no menor número de cliques possível.
                </p>
                <p className="mb-4">
                    Você pode clicar nos links da página para navegar, e também pode usar o botão de voltar do
                    navegador.
                </p>
                <p
                    className="mb-
                4"
                >
                    O jogo termina quando você chega na página objetivo. Boa sorte!
                </p>
                <label className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        onChange={(e) => {
                            localStorage.setItem("naoMostrarMaisComoJogarModal", e.target.checked.toString());
                        }}
                    />
                    Não mostrar mais este modal
                </label>
            </div>
        </div>
    );
}
