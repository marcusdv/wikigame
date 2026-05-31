// Para cada página do array, busca o texto de abertura na Wikipedia e salva
// num arquivo de texto — útil para confirmar que o conteúdo retornado é o
// artigo esperado e não uma desambiguação ou página errada.
//
// Uso: tsx inspecionar-paginas.test.ts (dentro da pasta __testes__)

// "fs" é o módulo nativo do Node.js para mexer com arquivos do computador.
// fs = file system (sistema de arquivos).
// Com ele você pode criar, ler, editar e deletar arquivos.
import fs from "fs";

// "path" é o módulo nativo do Node.js para montar e manipular caminhos de arquivos.
// Ele resolve diferenças entre sistemas operacionais (Windows usa \, Linux/Mac usam /).
import path from "path";

import { arrNovas } from "./novas";

// Tempo de espera entre cada requisição à Wikipedia (em milissegundos).
// Evita sobrecarregar o servidor da Wikipedia com muitas requisições seguidas.
const DELAY_MS = 700;

// Quantas palavras do resumo mostrar por página.
const LIMITE_PALAVRAS = 300;

// Identificação obrigatória para requisições à API da Wikipedia.
// Sem isso, a Wikipedia pode bloquear requisições vindas de servidores.
const USER_AGENT = "WikiRun/1.0 (inspecao de conteudo; marcus.vinicius.bittencourt.c@gmail.com)";

// Função utilitária que pausa a execução por `ms` milissegundos.
// Promise é uma forma de lidar com operações que levam tempo (assíncronas).
// setTimeout agenda uma função para rodar depois de X ms — aqui só resolve a Promise, descongelando o código.
const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Busca o resumo em texto puro da página na API de sumário da Wikipedia.
// A API devolve o campo `extract` com o texto de abertura do artigo, sem HTML.
// Retorna null se a página não existir ou a requisição falhar.
async function buscarResumo(titulo: string): Promise<string | null> {
    // encodeURI transforma caracteres especiais em formato seguro pra URL.
    // Ex: "Jimmy Carter" → "Jimmy%20Carter"
    const url = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURI(titulo)}`;
    try {
        const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });

        // Se a Wikipedia retornou erro (página não existe, etc), devolve null.
        if (!res.ok) return null;

        const dados = await res.json();

        // ?? null: se `extract` não existir na resposta, retorna null em vez de undefined.
        return dados.extract ?? null;
    } catch {
        // Se a requisição falhar completamente (sem internet, timeout, etc), retorna null.
        return null;
    }
}

// Corta o texto nas primeiras `n` palavras para não poluir o arquivo com textos enormes.
// split(/\s+/) divide o texto em palavras usando qualquer espaço em branco como separador.
// slice(0, n) pega só as primeiras n palavras.
// join(" ") junta tudo de volta numa string separada por espaços.
function primeirasNPalavras(texto: string, n: number): string {
    const palavras = texto.trim().split(/\s+/);
    const cortado = palavras.slice(0, n).join(" ");

    // Se o texto original tinha mais palavras do que o limite, adiciona "..." no final.
    return palavras.length > n ? cortado + "..." : cortado;
}

const paginas = arrNovas;

async function main() {
    // `saida` é uma string que vai acumulando todo o conteúdo do arquivo.
    // Em vez de escrever linha por linha no disco, acumula tudo na memória
    // e escreve de uma vez só no final — mais eficiente.
    let saida = "";

    saida += `Inspecionando ${paginas.length} páginas (${DELAY_MS}ms entre cada)...\n\n`;
    saida += "=".repeat(60) + "\n";

    for (let i = 0; i < paginas.length; i++) {
        const titulo = paginas[i];

        // Aguarda a resposta da Wikipedia antes de continuar para a próxima página.
        const resumo = await buscarResumo(titulo);

        saida += `\n[${i + 1}/${paginas.length}] ${titulo}\n`;
        saida += "─".repeat(60) + "\n";

        if (resumo) {
            saida += primeirasNPalavras(resumo, LIMITE_PALAVRAS) + "\n";
        } else {
            saida += "  ✗  Falha ao buscar conteúdo.\n";
        }

        // Mostra o progresso no terminal em tempo real enquanto o arquivo ainda está sendo montado.
        console.log(`[${i + 1}/${paginas.length}] ${titulo}`);

        // Aguarda antes de buscar a próxima página, respeitando o limite da Wikipedia.
        // A condição evita esperar desnecessariamente depois da última página.
        if (i < paginas.length - 1) await sleep(DELAY_MS);
    }

    saida += "\n" + "=".repeat(60) + "\n";
    saida += `Concluído. ${paginas.length} páginas inspecionadas.\n`;

    // __dirname é uma variável do Node.js que contém o caminho absoluto da pasta
    // onde este arquivo está salvo. Ex: "/home/marcus/.../my-app/__testes__"
    //
    // path.join() monta um caminho juntando as partes com o separador correto do SO.
    // Resultado: "/home/marcus/.../my-app/__testes__/resultado.txt"
    //
    // Usar __dirname garante que o arquivo sempre seja criado na mesma pasta do script,
    // independente de onde você rodou o comando no terminal.
    const destino = path.join(__dirname, "resultado.txt");

    // fs.writeFileSync escreve o conteúdo de `saida` no arquivo em `destino`.
    // - Se o arquivo não existir, ele cria.
    // - Se já existir, ele sobrescreve.
    // - "utf-8" define o encoding — padrão para texto com acentos e caracteres especiais.
    // - Sync = síncrono: o código para aqui e espera a escrita terminar antes de continuar.
    fs.writeFileSync(destino, saida, "utf-8");

    console.log(`\nArquivo gerado: ${destino}`);
}

// Inicia o programa. O .catch(console.error) garante que se algo der errado
// dentro do main(), o erro aparece no terminal em vez de sumir silenciosamente.
main().catch(console.error);
