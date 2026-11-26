# TODO — WikiRun

Revisão da lógica do projeto feita em 25/11/2026. Itens em ordem de prioridade.
Legenda: 🔴 grave · 🟠 bug de lógica · 🟡 qualidade · 🧪 testes

---

## 🔴 1. Recordes podem ser forjados por qualquer pessoa

**O que acontece hoje**
- Ao vencer, `app/components/VoceVenceuTela.tsx` (linha ~111) faz `upsert` na tabela `recordes`
  **direto do navegador**, com a chave pública (anon), e é o navegador que diz `id_usuario` e `pontos`.
- O login é próprio (JWT com `jose`, cookie `token`), **não** é o Supabase Auth. Então o banco
  não sabe quem está logado: as regras de RLS não conseguem diferenciar "o Marcus" de "um anônimo".
- Se o insert funciona hoje, é porque o anon tem permissão de inserir em `recordes`.
  Qualquer pessoa, pelo console do navegador, consegue:
  `supabase.from("recordes").insert({ id_usuario: "<id de alguém>", pontos: 1, id_palavra_do_dia: 42 })`

**Status (26/11/2026):** rota criada, tela de vitória usando a rota e recorde salvando (testado:
jogar deslogado, vencer, entrar). O `service_role` tinha perdido o acesso às tabelas e à sequence
`pontuacao_id_seq`; foi restaurado com `grant all ... to service_role` (+ `alter default privileges`).
Os `revoke` do anon foram rodados em 26/11/2026; recorde e página de recordes conferidos depois.
Falta só o INSERT do anon em `palavras_do_dia`, que sai com o item 2.

**O que fazer**
- [x] Criar a rota `app/api/recordes/route.ts` (POST):
  1. Lê o cookie `token` e valida com `jwtVerify` (igual a `app/api/me/route.ts`). Sem token → 401.
  2. Pega o `id` do usuário **do token**, nunca do corpo da requisição.
  3. Recebe do corpo só o `historico` (lista de páginas) e a data do desafio.
  4. Busca a palavra do dia daquela data no banco (com `supabaseAdmin`).
  5. Confere o básico: `historico[0]` é a inicial do dia, o último item é o objetivo
     (comparando sem maiúsculas) e o histórico não está vazio.
  6. Calcula os pontos no servidor (ou, no mínimo, rejeita `pontos < saltos`).
  7. Grava com `supabaseAdmin` (upsert com `ignoreDuplicates`, como hoje).
- [x] No Supabase: devolver ao `service_role` o acesso às tabelas e sequences do schema `public`.
- [x] No Supabase, tirar do anon o que o navegador não usa mais:
  `revoke insert, update, delete on public.recordes from anon, authenticated;`
  `revoke all on public.usuarios from anon, authenticated;` + `grant select (id, nome) on public.usuarios to anon;`
  `revoke update, delete on public.palavras_do_dia from anon, authenticated;`
  (o INSERT do anon em `palavras_do_dia` só sai junto com o item 2.)
- [x] Em `VoceVenceuTela.tsx`, trocar o `supabase.from("recordes").upsert(...)` por
  `fetch("/api/recordes", { method: "POST", body: JSON.stringify({ historico, data }) })`.
- [ ] No Supabase, **remover a política de INSERT/UPDATE do anon** na tabela `recordes`
  (o servidor usa a service role, que ignora RLS). Leitura (SELECT) pode continuar pública para o ranking.

> Limite conhecido: isso impede gravar recorde no nome de outra pessoa e pontos impossíveis,
> mas não impede alguém de inventar um histórico plausível. Para um jogo casual, é suficiente.

---

## 🔴 2. A palavra do dia é criada pelo navegador

**O que acontece hoje**
- `app/diario/DesafioDiario.tsx` (linha ~74): o primeiro visitante do dia sorteia a palavra
  no navegador e faz `insert` em `palavras_do_dia` com a chave anon.
- Problema: qualquer pessoa pode inserir **antes** a linha de amanhã com as palavras que quiser
  e trocar o desafio de todo mundo.

**Por que foi feito assim:** a Vercel gratuita não tem um processo rodando o tempo todo;
a função só roda quando alguém acessa. Isso continua valendo na solução abaixo: o que muda é
**quem** grava (o servidor, e não o navegador), não **quando**.

**O que fazer (opção A, recomendada, gratuita e no mesmo modelo de hoje)**
- [ ] Criar a rota `app/api/palavra-do-dia/route.ts` (GET):
  1. Calcula a data de hoje em Brasília (mesma conta de hoje: UTC − 3h).
  2. Busca a linha dessa data em `palavras_do_dia` com `supabaseAdmin`.
  3. Se não existir: sorteia com `sortearJogo(iniciais, objetivos, data)` (é determinístico,
     então dá sempre o mesmo resultado) e insere com `supabaseAdmin`.
     Se o insert falhar por duplicidade (`23505`, outra pessoa criou ao mesmo tempo), busca de novo.
  4. Devolve `{ id, inicial, objetivo, data }`.
- [ ] Em `DesafioDiario.tsx`, trocar as consultas/insert do Supabase por `fetch("/api/palavra-do-dia")`.
  Isso também resolve o item 7 (tela em branco).
- [ ] No Supabase, **remover a política de INSERT do anon** em `palavras_do_dia`.

**Opção B (extra, opcional): gerar a palavra antes de alguém acessar**
- Vercel Cron Jobs: no plano gratuito (Hobby) dá para agendar uma chamada por dia.
  Um `vercel.json` com `"crons": [{ "path": "/api/palavra-do-dia", "schedule": "5 3 * * *" }]`
  (03:05 UTC = 00:05 em Brasília) chama a rota todo dia. Proteger a rota com o
  `CRON_SECRET` que a Vercel envia no cabeçalho `Authorization`.
- Alternativa: `pg_cron` do próprio Supabase (também gratuito), rodando SQL dentro do banco.
- Não é obrigatório: com a opção A, a palavra já é criada com segurança no primeiro acesso.

---

## 🔴 3. Conferir se a tabela `usuarios` está exposta

**Por que:** `VoceVenceuTela.tsx` (linha ~42) e `app/recordes/page.tsx` leem `usuarios` com a
chave anon. Se a política de leitura liberar a tabela inteira, qualquer pessoa lê `email` e
`senha_hash` de todos os usuários.

**Onde conferir:** painel do Supabase → projeto → **SQL Editor** → "New query". Rodar e colar o resultado:

```sql
-- 1) RLS está ligado em cada tabela? (relrowsecurity = true)
select relname, relrowsecurity
from pg_class
where relname in ('usuarios', 'recordes', 'palavras_do_dia');

-- 2) Quais políticas existem (quem pode o quê)
select tablename, policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public';

-- 3) Quais colunas de usuarios o anon pode ler
select column_name, privilege_type
from information_schema.column_privileges
where table_name = 'usuarios' and grantee = 'anon';
```

(Também dá para ver pela interface: **Table Editor** → tabela → botão "RLS policies".
Não é preciso compartilhar chaves, só o resultado das consultas.)

- [ ] Rodar as consultas e analisar o resultado.
- [ ] Se o anon lê `email`/`senha_hash`: criar uma view só com `id, nome`
  (ex.: `create view usuarios_publicos as select id, nome from usuarios;`), usar a view no
  ranking e tirar do anon o acesso à tabela `usuarios`.

---

## 🔴 4. Loop de requisições para quem já venceu o desafio do dia

**O que acontece hoje**
- `DesafioDiario.tsx` (linha ~136), efeito "VERIFICA SE USUARIO JÁ VENCEU O JOGO".
- `carregarJogoExistente` está nas dependências do efeito, mas é uma função **recriada a cada render**.
  Então o efeito roda em todo render. Quando acha o recorde, faz `dispatch` → novo render →
  efeito de novo → nova consulta → novo `dispatch`... Um loop de consultas ao Supabase enquanto
  a pessoa estiver na página. Além disso, `historico` nas dependências faz o efeito rodar a cada clique.

**O que fazer** (feito em 25/11/2026)
- [x] Deixar o efeito depender só de `[usuario, idPalavraDoDia]` (e da função estável).
- [x] Ler `paginaObjetivo`, `historico` e `custoDeVoltar` por uma ref, para não precisar delas nas dependências.
- [x] `useCallback` em `carregarJogoExistente` e `iniciarNovoJogo` no `useGameLogic`.
- [x] Mostrar o antes/depois ao dono.

## ✅ Jogar o diário deslogado e entrar no fim para salvar o recorde
- [x] Tela de vitória: "Entre para salvar seu recorde de N pontos" com os botões Entrar e Criar conta
  (feito em 25/11/2026). O progresso fica no localStorage e o login/registro voltam ao /diario.
- [ ] Limite: se a pessoa vencer e só entrar no dia seguinte, o diário abre o desafio novo e o
  recorde do dia anterior não é salvo.

---

## 🟠 5. Vitória não é detectada ao chegar por redirecionamento ou link de seção

**O problema, com exemplo**
1. O objetivo é **"Estados Unidos"**.
2. Num artigo, o jogador clica num link escrito "EUA". O `href` desse link é `/wiki/EUA`.
3. `handleLinkClicado` (`useGameLogic.ts`, linha ~116) transforma o href em `"EUA"` e guarda
   como página atual.
4. A rota `/api/wiki` pergunta à Wikipedia, que redireciona `EUA → Estados Unidos` e devolve
   o artigo certo. O jogador **vê** a página "Estados Unidos".
5. Mas o reducer compara `"eua"` com `"estados unidos"` → diferente → **não venceu**.
- O mesmo vale para links de seção: `/wiki/Chocolate#História` vira `"Chocolate#História"`.

**A solução, passo a passo**
- [ ] **Passo 1 — a rota passa a fazer uma requisição só** (`app/api/wiki/route.ts`).
  Hoje são duas: `summary` (para descobrir o título oficial) e depois `parse`.
  A API de parse já sabe seguir redirecionamentos com o parâmetro `redirects=1`:
  `https://pt.wikipedia.org/w/api.php?action=parse&page=EUA&redirects=1&format=json&prop=text`
  A resposta traz `parse.title = "Estados Unidos"` (o título final) e `parse.text` (o HTML).
  Resultado: metade das requisições (o jogo fica mais rápido) e o título certo de graça.
- [ ] **Passo 2 — a rota devolve o título final.**
  Responder algo como `{ titulo: dados.parse.title, html: dados.parse.text["*"] }`.
- [ ] **Passo 3 — o hook usa o título final** (`useGameLogic.ts`, no efeito de busca).
  Trocar `dispatch({ type: "NAVEGOU", pagina: state.paginaAtual })` por
  `dispatch({ type: "NAVEGOU", pagina: dados.titulo })`.
  Assim o histórico guarda "Estados Unidos" (e não "EUA").
- [ ] **Passo 4 — o reducer compara com a página que chegou** (`gameReducer.ts`, `NAVEGOU`).
  Comparar `action.pagina` com `state.paginaObjetivo` (hoje compara `state.paginaAtual`,
  que só funciona por coincidência).
- [ ] **Passo 5 — cortar a seção do link** (`handleLinkClicado`).
  Antes de decodificar: `href.split("#")[0]`, para `/wiki/Chocolate#História` virar `Chocolate`.
- [ ] Cuidado na comparação "é navegação nova?" do hook (linha ~55): ela compara a página
  pedida com a última do histórico; com o título final, comparar `dados.titulo` com a última.

---

## 🟠 6. Links que não são artigos (categorias, páginas especiais, coordenadas...)

**O que acontece hoje**
- O filtro em `handleLinkClicado` só bloqueia `Ficheiro:`, `File:`, `Ajuda:` e `Wikipedia:`
  (sem acento; na Wikipedia em português é `Wikipédia:`).
- Categorias (`Categoria:`), páginas especiais (`Especial:`), portais, predefinições e discussões
  passam e contam como salto.
- Links de coordenadas caem numa página especial: a API dá erro, aparece o toast
  "Erro ao buscar na API…" e o jogo volta para a página anterior. Funciona por acidente,
  gasta uma requisição e mostra mensagem técnica.

**O que fazer (reaproveitando o toast que já existe)**
- [ ] Em `handleLinkClicado`, decodificar o título e checar se ele começa com um prefixo de
  namespace (`Categoria:`, `Especial:`, `Ficheiro:`, `Ajuda:`, `Wikipédia:`, `Portal:`,
  `Predefinição:`, `Discussão:`, `Usuário(a):`, `Módulo:`...). Guardar a lista no topo do arquivo.
- [ ] Se for: chamar `mostrarMensagem("Esse link não é um artigo, escolha outro.")`
  (já existe em `app/components/Toast.tsx`) e **não** navegar nem fazer requisição.
- [ ] Ignorar links vermelhos (página não existe: href com `redlink=1`) com a mesma mensagem.

---

## 🟠 7. Desafio diário trava se o insert da palavra do dia falhar

- `DesafioDiario.tsx` (linha ~80): `iniciarNovoJogo` só roda se o insert der certo.
  Se duas pessoas abrirem ao mesmo tempo, a segunda recebe erro de duplicidade → tela em branco.
- [ ] Resolvido junto com o item 2 (a rota busca de novo quando há duplicidade).
  Enquanto isso não é feito: chamar `iniciarNovoJogo(start, target)` mesmo se o insert falhar.

---

## 🟠 8. Início igual ao objetivo = partida impossível de vencer

- A vitória só é checada quando o jogador navega (`NAVEGOU`). Se o sorteio cair na mesma
  página nas duas listas, o jogo começa nela e nunca vence.
- [ ] Em `sortearJogo`, se `start === target` (sem maiúsculas), sortear de novo:
  - modo aleatório: novo `Math.random()`;
  - modo com semente: tentar `seed + ":1"`, `seed + ":2"`... (continua determinístico).
- [ ] Garantir pelo validador de listas (item 🧪 abaixo) que as listas não se cruzam.

---

## 🟡 Qualidade e detalhes

- [ ] Apagar `app/lib/useLocalStorage.ts`: não é usado e tem bug (`setItem("chave", ...)` grava a
  palavra "chave" literal em vez da variável).
- [ ] `useGameLogic`: cancelar requisições antigas com `AbortController` (resposta lenta pode
  chegar depois de uma mais nova).
- [ ] Autenticação:
  - [ ] Conferir `JWT_SECRET` num lugar só (um `app/lib/jwt.ts` que exporta a chave e falha
    se faltar). Hoje só o `register` confere; `login`, `me` e `proxy` assinariam com "undefined".
  - [ ] Guardar e buscar o email em minúsculas (`z.email().toLowerCase()` no Zod).
  - [ ] Limite de tentativas no login (opcional).
- [ ] `proxy.ts`: o código protege `/jogar`, mas o `matcher` lista `/treinamento` (e não `/jogar`).
  Decidir o que exige login e alinhar os dois.
- [ ] Limpeza: `console.log` em `Treinamento.tsx` e no `register`; `setJogoInicial` sem efeito no
  diário; `dataDeHoje()` duplicada (diário e recordes) → mover para `app/lib/`;
  `JSON.parse` do localStorage sem `try/catch`.
- [ ] Brecha de jogabilidade: dá para descobrir o caminho deslogado (ou limpando o localStorage)
  e depois repetir logado. Ideia: o servidor registra a hora de início do desafio do usuário.

---

## 🧪 Testes

### Validador das listas de páginas (substitui os scripts do `_playground`)
As listas são feitas à mão, então o validador confere o que o olho não pega.
- [ ] Um script `validarPaginas.ts` que lê `app/dados/paginasIniciais.ts`, `app/dados/paginasObjetivo.ts`
  (e, opcionalmente, as listas novas do `_playground/novos-dados/`) e confere:
  - [ ] a página existe (`missing`);
  - [ ] o título é o oficial (`redirects` / `normalized`: ex. "EUA" → use "Estados Unidos");
  - [ ] não é página de desambiguação (`pageprops.disambiguation`);
  - [ ] não há repetidas **dentro** de cada lista (comparando pelo título resolvido);
  - [ ] as duas listas **não se cruzam** (nenhuma página é inicial e objetivo ao mesmo tempo; item 8);
  - [ ] termina com `process.exit(1)` se houver problema (para poder usar num CI ou hook).
- [ ] Usar a API de consulta com até 50 títulos por requisição, em vez de 1 por vez:
  `https://pt.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1&prop=pageprops&ppprop=disambiguation&titles=A|B|C`
- [ ] Escolher a lista por argumento (`npm run validar -- objetivos`), sem editar o código.
- [ ] Usar `encodeURIComponent` (títulos com `/`, `?`, `#` quebram com `encodeURI`).
- [ ] Depois de pronto: apagar `seTituloEIgualNaWiki.ts`, `checaConteudoNaWiki.ts`, as cópias em
  `pesquisando/*.txt` e corrigir os comentários que citam `__testes__/`.

### Testes unitários do jogo
- [ ] `gameReducer` com `node:test` (sem instalar nada): vitória com maiúsculas diferentes,
  custo de voltar (0 → 1 → 2, e não passa de 2), voltar pelo histórico, erro ao buscar página.
- [ ] `sortearJogo`: mesma semente → mesmo jogo; início nunca igual ao objetivo.
