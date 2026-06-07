# GESTAO-COMERCIAL

Sistema de gestão comercial completo desenvolvido em TypeScript com Node.js. Projeto acadêmico do 2º semestre de Análise e Desenvolvimento de Sistemas (ADS), cobrindo operações de clientes, produtos, pedidos, financeiro, funcionários e integrações com hardware.

---

## Sumário

- [Descrição](#descrição)
- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Módulos do Sistema](#módulos-do-sistema)
- [Funcionalidades](#funcionalidades)
- [Documentação da API](#documentação-da-api)
- [Testes](#testes)
- [Estrutura de Pastas](#estrutura-de-pastas)
- [Exemplos de Uso da API](#exemplos-de-uso-da-api)
- [Integrantes do Grupo](#integrantes-do-grupo)

---

## Descrição 

O **Sistema de Gestão Comercial** é uma API REST completa voltada para o gerenciamento de pequenos e médios comércios. Ele integra em um único sistema o controle de clientes, estoque de produtos, fluxo de pedidos, lançamentos financeiros, gestão de funcionários e comunicação com dispositivos de hardware (impressora térmica e balança eletrônica).

O sistema foi projetado com arquitetura modular (rotas → controllers → services → banco de dados), validação robusta de dados com Zod, suporte a transações no banco de dados SQLite, soft-delete em todos os cadastros e geração automática de entradas financeiras a partir de pedidos entregues.

---

## Tecnologias

| Camada | Tecnologia |
|---|---|
| Linguagem | TypeScript (modo estrito) |
| Runtime | Node.js |
| Framework Web | Express.js |
| Banco de Dados | SQLite3 |
| Validação | Zod |
| Documentação | Swagger UI / OpenAPI 3.0 |
| Testes | Jest + Supertest |
| Transpilador dev | TSX (tsx watch) |
| Segurança | Helmet, CORS |
| Logging | Morgan |

---

## Pré-requisitos 

Antes de começar, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) v18 ou superior
- [npm](https://www.npmjs.com/) v9 ou superior
- Git

  ---

## Instalação

### 1. Clonar repositório

```bash
git clone https://github.com/seu-usuario/gestao-comercial.git
cd gestao-comercial
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Copie o arquivo de exemplo e edite conforme o seu ambiente:

```bash
cp .env.example .env
```

Abra o arquivo `.env` e preencha as variáveis:

```env
PORT=3000
NODE_ENV=development
DB_PATH=./data/gestao.db

# Impressora ESC/POS via TCP
PRINTER_TYPE=network
PRINTER_HOST=192.168.1.100
PRINTER_PORT=9100

# Balança via TCP
BALANCA_HOST=192.168.1.101
BALANCA_PORT=8008

# Dados da empresa
EMPRESA_NOME=Minha Empresa Ltda
EMPRESA_CNPJ=00.000.000/0001-00
```
  
> As variáveis de impressora e balança são necessárias apenas se for utilizar as integrações com hardware. As demais são obrigatórias.

### 4. Iniciar o servidor em modo de desenvolvimento

```bash
npm run dev
```

O servidor estará disponível em `http://localhost:3000`.

Para iniciar em modo de produção:

```bash
npm start
```

---

## Módulos do Sistema

### Clientes

Gerencia o cadastro de clientes pessoa física ou jurídica. Permite busca por nome, telefone ou documento, histórico de pedidos por cliente e cálculo do total gasto. O cadastro utiliza soft-delete, preservando o histórico mesmo após inativação.

### Produtos 

Controla o catálogo de produtos com código de barras, preço de custo e venda, unidade de medida, categoria e estoque (atual e mínimo). Registra todas as movimentações de estoque (entrada, saída e ajuste) com rastreabilidade completa. Suporta geração de código de barras EAN-13 no padrão brasileiro (prefixo 789).

### Pedidos 

Gerencia o ciclo de vida completo de um pedido: criação com múltiplos itens, validação de estoque, dedução automática do estoque ao criar o pedido, devolução do estoque em caso de cancelamento e geração automática de lançamento financeiro ao marcar o pedido como entregue.

Fluxo de status: `aberto` → `confirmado` → `em_preparo` → `pronto` → `entregue` (ou `cancelado` em qualquer etapa).

### Financeiro 

Registra e categoriza todos os lançamentos financeiros da empresa (receitas e despesas). Gera relatórios de fluxo de caixa por período, breakdown diário e resumo por categoria. Lançamentos gerados automaticamente por pedidos entregues são protegidos contra exclusão manual.

### Funcionarios 

Cadastra e gerencia funcionários com cargo, salário-base e datas de admissão e demissão. Realiza cálculos de:

- **Salário líquido** com desconto de INSS e IRRF conforme tabelas 2024
- **Férias** com adicional de 1/3 e opção de abono pecuniário (venda de 10 dias)

Suporta soft-delete com registro de data de demissão.

### Intregrações 

Conecta o sistema com dispositivos físicos e utilitários:

- **Geração de código de barras** em SVG (CODE128 e EAN-13)
- **Balança eletrônica** via protocolo TCP (envio de produto para pesagem)
- **Impressora térmica ESC/POS** via TCP (impressão de cupom de pedido com formatação, negrito, alinhamento e corte automático)

---

### Funcionalidades 

| Camada | Tecnologia ||---|---| 

