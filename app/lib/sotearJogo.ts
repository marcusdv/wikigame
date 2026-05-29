// Sorteia páginas de início e objetivo sem repetição.
// Se passado uma seed, sortearJogo() é determinístico
export function sortearJogo(arr1: string[], arr2: string[], seed?: string): { start: string; target: string } {
    if (seed) {
        const hash = [...seed].reduce((acc, c) => acc + c.charCodeAt(0), 0);

        const startIndex = hash % arr1.length;
        const targetIndex = (hash * 31) % arr2.length;

        return { start: arr1[startIndex]!, target: arr2[targetIndex]! };
    }

    // Sem seed, sorteio aleatório normal.
    const start = arr1[Math.floor(Math.random() * arr1.length)];
    const target = arr2[Math.floor(Math.random() * arr2.length)];

    return { start, target };
}
