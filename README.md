# Cheiraí — projeto corrigido

Aplicação web para controlar a validade de alimentos após a abertura, com dashboard, produtos, histórico, configurações de alertas e família compartilhada.

## O que foi corrigido

- Removida a estrutura duplicada que fazia existir um projeto incompleto na raiz e outro dentro de `cheirai-novo/`.
- Criado um único frontend em React + Vite.
- Corrigida a autenticação para usar um `AuthContext` compartilhado. Antes, cada página criava um estado de login independente.
- Adicionado layout protegido com navegação permanente entre **Dashboard**, **Produtos**, **Histórico** e **Configurações**.
- Adicionadas rotas de API que faltavam para categorias, locais, filtros, edição, exclusão, duplicação, resumo do dashboard, histórico, exportação CSV, notificações e família.
- Padronizados todos os nomes de campos para o modelo SQL fornecido (`id_usuario`, `id_produto`, `nome_produto`, `nome_categoria`, `nome_local` etc.).
- Corrigida a regra de histórico: o produto não é apagado depois de consumido/descartado; ele deixa de ser ativo por possuir um registro no histórico. Assim, o histórico não desaparece por causa da chave estrangeira.
- Aplicadas as regras de data de abertura, prazo entre 1 e 365 dias e bloqueio de consumo de produto vencido.
- Incluído banco de dados revisado em `database/cheirai_modelo_er.sql`.

## Requisitos

- Node.js 18 ou superior
- MySQL 8.0 ou superior
- npm

## 1. Banco de dados

Abra o MySQL Workbench e execute:

```text
database/cheirai_modelo_er.sql
```

Para a atualização automática diária dos status, habilite o agendador do MySQL com um usuário administrativo:

```sql
SET GLOBAL event_scheduler = ON;
```

Mesmo sem o agendador, a API recalcula o status nas consultas.

## 2. Backend

```bash
cd backend
cp .env.example .env
```

Edite `.env` com os dados do seu MySQL e execute:

```bash
npm install
npm run dev
```

API: `http://localhost:5000`

## 3. Frontend

Em outro terminal:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Aplicação: `http://localhost:5173`

## Páginas disponíveis

- `/dashboard`
- `/produtos`
- `/historico`
- `/configuracoes`

As páginas são protegidas por login. A navegação aparece no menu lateral no desktop e no menu móvel em telas menores.

## Observações

- Login social Google/Apple, notificações push reais, leitura de código de barras pela câmera e sincronização offline exigem configuração de serviços externos e não são simulados como se estivessem prontos.
- A exportação PDF do histórico usa a caixa de impressão do navegador; escolha **Salvar como PDF**.
- O modelo SQL original fornecido também foi preservado em `database/modelo_original_fornecido.sql` para comparação.
