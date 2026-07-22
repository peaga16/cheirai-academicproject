# Cheiraí

**Criador:** Pedro Henrique Alves Andrade — 2° ADS 2025.2

Cheiraí é uma aplicação web para controlar a validade de alimentos após a abertura. Permite registrar produtos, acompanhar prazos de validade, visualizar um painel (dashboard) com estatísticas e manter um histórico de ações (consumido, descartado).

Principais funcionalidades
- Dashboard com estatísticas de produtos (OK, Atenção, Vencidos)
- Cadastro, edição e exclusão de produtos
- Criação de produtos via leitura de código de barras (scanner)
- Histórico de ações (consumo/descartes) e estatísticas de desperdício
- Autenticação de usuários e rotas protegidas

Tecnologias
- Frontend: React + Vite
- Backend: Node.js + Express
- Banco de dados: MySQL
- Barcode: QuaggaJS (`@ericblade/quagga2`)

Pré-requisitos
- Node.js 18+ (ou versão compatível)
- npm
- MySQL 8+

Instalação (rápida)

1) Banco de dados

Importe o esquema SQL em um banco MySQL (por exemplo no MySQL Workbench):

```sql
-- arquivo disponível em /database
SOURCE database/cheirai_modelo_er.sql;
```

Se quiser comparar com o esquema original, há um arquivo em `database/modelo_original_fornecido.sql`.

Ative o agendador do MySQL se desejar tarefas agendadas (opcional):

```sql
SET GLOBAL event_scheduler = ON;
```

2) Backend

```bash
cd backend
cp .env.example .env
# Edite .env com as credenciais do seu banco
npm install
npm run dev
```

Por padrão a API roda em: `http://localhost:5000` (endereço configurável em `.env`).

3) Frontend

```bash
cd frontend
cp .env.example .env
# Edite .env caso queira alterar a URL da API
npm install
npm run dev
```

A aplicação frontend estará disponível em `http://localhost:5173`.

Uso básico
- Crie uma conta ou faça login.
- Acesse o painel em `/dashboard` para visualizar estatísticas.
- Cadastre produtos em `/produtos` ou use `/criar-produto` para adicionar rapidamente com leitura de código de barras.
- Consulte ações antigas em `/historico`.

Configurações e variáveis de ambiente
- Backend: copie `backend/.env.example` para `backend/.env` e ajuste `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, etc.
- Frontend: copie `frontend/.env.example` para `frontend/.env` caso queira sobrescrever a `VITE_API_BASE_URL`.

Dicas de desenvolvimento
- Se o frontend reclamar de imports (ex.: erro ao resolver `./styles/GlobalStyles.css`), verifique caminhos relativos em `src/main.jsx` (`../styles/GlobalStyles.css`).
- Tokens de autenticação são guardados no `localStorage` em desenvolvimento; limpar `localStorage` pode resolver problemas de login.

Estrutura do projeto (resumida)

- backend/ — API Express, rotas e serviços
- frontend/ — app React com Vite
- database/ — arquivos SQL (modelo e original)
- docs/ — documentação adicional

Contribuição
- Fork, crie uma branch com a sua feature/fix (`feature/nome`) e envie um pull request descrevendo as mudanças.

Suporte
- Abra uma issue descrevendo o bug ou a sugestão, incluindo passos para reproduzir e logs relevantes.



---
