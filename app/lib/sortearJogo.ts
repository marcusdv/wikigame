// Sorteia páginas de início e objetivo sem repetição.
// Se passado uma seed, sortearJogo() é determinístico
function hashCode(str: string): number {
    let h = 2166136261; // FNV-1a: distribuição muito mais uniforme
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
        h >>>= 0; // mantém unsigned 32-bit
    }
    return h;
}

export function sortearJogo(arr1: string[], arr2: string[], seed?: string): { start: string; target: string } {
    console.log("a seed aqui sorteada,", seed);
    if (seed) {
        const hash1 = hashCode(seed);
        const hash2 = hashCode(seed + ":target"); // seed diferente para independência

        const startIndex = hash1 % arr1.length;
        const targetIndex = hash2 % arr2.length;

        return { start: arr1[startIndex]!, target: arr2[targetIndex]! };
    }

    const start = arr1[Math.floor(Math.random() * arr1.length)]!;
    const target = arr2[Math.floor(Math.random() * arr2.length)]!;

    return { start, target };
}
