function verificarSeJaExiste(novas: string[], paginas: string[]) {
    return novas.filter((palavra) => paginas.includes(palavra));
}

console.log(verificarSeJaExiste([], []));
