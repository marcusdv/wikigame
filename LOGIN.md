# Sistema de Login — Decisões

## Método de autenticação

**Fase 1:** Email + senha com cookie de sessão
**Fase 2:** Adicionar login com Google (OAuth) depois que a fase 1 estiver pronta

## Banco de dados

**Supabase** (já configurado no projeto)

---

## O que precisa ser feito (fase 1)

### 1. Tabela de usuários no Supabase
Criar uma tabela `usuarios` com:
- `id` — identificador único
- `email` — único, não pode repetir
- `senha_hash` — nunca a senha em texto puro, sempre o hash
- `criado_em` — data de criação

### 2. Rota de cadastro — `POST /api/register`
- Recebe `email` e `senha`
- Gera o hash da senha com **bcrypt**
- Salva o usuário no Supabase
- Retorna erro se o email já existir

### 3. Rota de login — `POST /api/login`
- Recebe `email` e `senha`
- Busca o usuário no banco pelo email
- Compara a senha com o hash salvo (bcrypt)
- Se ok: cria uma sessão e seta um cookie no navegador
- Se não: retorna erro

### 4. Rota de sessão — `GET /api/me`
- Lê o cookie da requisição
- Valida se a sessão existe e não expirou
- Retorna os dados do usuário logado (ou erro 401)

### 5. Proteção de páginas
- Páginas que exigem login verificam a sessão
- Se não tiver sessão válida → redireciona pro `/login`

### 6. Rota de logout — `POST /api/logout`
- Apaga a sessão
- Limpa o cookie

---

## Tecnologias da fase 1

| Função | Tecnologia |
|---|---|
| Banco de dados | Supabase (PostgreSQL) |
| Hash de senha | `bcrypt` |
| Cookie de sessão | `cookies()` do Next.js |
| Token de sessão | JWT com biblioteca `jose` |

---

## Fase 2 — Login com Google (depois)

- Usar **NextAuth.js (Auth.js)** para OAuth
- Vai precisar criar um app no Google Cloud Console para obter as credenciais
- O Google retorna email + nome, que serão salvos na mesma tabela de usuários
