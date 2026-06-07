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

### Fluxo de Caixa
Relatório consolidado de receitas e despesas por período com saldo final, breakdown diário e agrupamento por categoria.

### Cálculo de Salário com INSS e IR
Cálculo progressivo do INSS (4 faixas, teto R$ 7.786,02) e IRRF (5 faixas com deduções), seguindo as tabelas vigentes de 2024. Retorna o detalhamento de cada desconto e o salário líquido final.

### Cálculo de Férias
Calcula o valor bruto e líquido das férias com adicional constitucional de 1/3, INSS e IRRF, com opção de abono pecuniário (venda de 10 dias de férias).

### Leitor de Código de Barras
Busca de produtos pelo código de barras e geração de SVG de código de barras nos formatos CODE128 e EAN-13, prontos para impressão ou exibição na tela.

### Controle de Estoque
Movimentações tipadas (entrada, saída, ajuste) com rastreabilidade por referência (ex: pedido que originou a saída). Alerta de estoque baixo quando o estoque atual é menor ou igual ao estoque mínimo configurado.

### Sistema de Pedidos
Criação de pedidos com múltiplos itens, validação de disponibilidade em estoque, atualização de status com transições validadas, reversão automática do estoque ao cancelar e registro financeiro automático ao entregar.

### Integração com Impressora ESC/POS
Impressão de cupom de pedido em impressora térmica via rede TCP, com suporte a formatação ESC/POS (negrito, alinhamento, corte de papel).

### Integração com Balança
Envio de dados de produto para balança eletrônica via protocolo TCP, com pacotes formatados conforme o padrão do equipamento.

### Geração de Código de Barras EAN-13
Geração automática de códigos EAN-13 com prefixo 789 (padrão brasileiro), incluindo cálculo do dígito verificador.

### Cálculo de Taxa de Entrega
Suporte a desconto e taxa de entrega no cálculo do total dos pedidos (subtotal − desconto + taxa de entrega).

---

## Documentação da API

A documentação interativa Swagger UI está disponível após iniciar o servidor:

```
http://localhost:3000/api/docs
```

O JSON da especificação OpenAPI 3.0 pode ser acessado em:

```
http://localhost:3000/api/docs.json
```

A documentação cobre todos os endpoints com schemas de requisição e resposta, exemplos, códigos de erro e parâmetros de paginação.

---

## Testes

O projeto usa Jest com Supertest e banco de dados SQLite em memória, garantindo que os testes sejam isolados e não afetem dados reais.

### Executar todos os testes

```bash
npm test
```

Os testes cobrem os módulos:

- `tests/clientes.test.ts` — CRUD e validações de clientes
- `tests/produtos.test.ts` — CRUD, movimentações de estoque e filtros
- `tests/pedidos.test.ts` — Criação, transições de status e estoque
- `tests/financeiro.test.ts` — Lançamentos e relatórios
- `tests/funcionarios.test.ts` — Cadastro, cálculo de salário e férias

---

## Estrutura de Pastas

```
gestao-comercial/
├── data/                          # Arquivos do banco de dados SQLite
│   └── gestao.db
├── public/                        # Arquivos estáticos
├── src/
│   ├── controllers/
│   │   ├── index.ts               # Controllers de todos os módulos
│   │   └── clienteController.ts   # Controller específico de clientes
│   ├── middlewares/
│   │   └── validar.ts             # Validação Zod, AppError e respostas padrão
│   ├── models/
│   │   ├── database.ts            # Inicialização do SQLite e schema das tabelas
│   │   └── schemas.ts             # Schemas de validação Zod
│   ├── routes/
│   │   └── index.ts               # Definição de todas as rotas da API
│   ├── services/
│   │   ├── clienteService.ts      # Regras de negócio de clientes
│   │   ├── produtoService.ts      # Regras de negócio de produtos e estoque
│   │   ├── pedidoService.ts       # Regras de negócio de pedidos
│   │   ├── financeiroService.ts   # Regras de negócio financeiro
│   │   ├── funcionarioService.ts  # Regras de negócio de funcionários
│   │   └── integracoesService.ts  # Barcode, impressora ESC/POS e balança
│   ├── types/
│   │   └── index.ts               # Interfaces TypeScript
│   ├── index.ts                   # Ponto de entrada do servidor Express
│   └── swagger.ts                 # Especificação OpenAPI 3.0
├── tests/
│   ├── setup.ts                   # Configuração do Jest e banco em memória
│   ├── helpers.ts                 # Utilitários para os testes
│   ├── clientes.test.ts
│   ├── produtos.test.ts
│   ├── pedidos.test.ts
│   ├── financeiro.test.ts
│   └── funcionarios.test.ts
├── .env                           # Variáveis de ambiente (não versionado)
├── .env.example                   # Modelo de variáveis de ambiente
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

---

## Exemplos de Uso da API

Todos os exemplos abaixo consideram o servidor rodando em `http://localhost:3000/api`.

---

### Clientes

**Listar clientes com paginação e busca**
```http
GET /clientes?page=1&pageSize=10&search=João
```

**Criar cliente**
```http
POST /clientes
Content-Type: application/json

{
  "nome": "João da Silva",
  "telefone": "(11) 99999-0000",
  "email": "joao@email.com",
  "cpf_cnpj": "123.456.789-00",
  "endereco": {
    "logradouro": "Rua das Flores",
    "numero": "123",
    "bairro": "Centro",
    "cidade": "São Paulo",
    "estado": "SP",
    "cep": "01310-100"
  }
}
```

**Histórico de pedidos do cliente**
```http
GET /clientes/1/historico
```

---

### Produtos

**Listar produtos com filtro de estoque baixo**
```http
GET /produtos?estoque_baixo=true&page=1&pageSize=20
```

**Criar produto**
```http
POST /produtos
Content-Type: application/json

{
  "nome": "Arroz Tipo 1 5kg",
  "codigo_barras": "7891234567890",
  "preco_custo": 12.50,
  "preco_venda": 18.90,
  "estoque_atual": 100,
  "estoque_minimo": 10,
  "unidade": "un",
  "categoria": "Alimentos"
}
```

**Movimentar estoque**
```http
POST /produtos/1/movimentar
Content-Type: application/json

{
  "tipo": "entrada",
  "quantidade": 50,
  "motivo": "Compra de fornecedor - NF 001234"
}
```

**Buscar por código de barras**
```http
GET /produtos/codigo/7891234567890
```

**Gerar EAN-13**
```http
GET /produtos/1/ean13
```

---
