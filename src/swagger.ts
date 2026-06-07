import { SwaggerUiOptions } from 'swagger-ui-express';

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Sistema de Gestão Comercial',
    description: `API REST completa para gestão comercial.

**Módulos disponíveis:**
- **Clientes** — Cadastro com endereço completo e histórico de pedidos
- **Produtos** — Cadastro com código de barras, estoque e categorias
- **Pedidos** — Emissão e controle de status do ciclo completo
- **Financeiro** — Fluxo de caixa, lançamentos e relatórios
- **Funcionários** — Cadastro, cálculo de salário (INSS/IR) e férias
- **Integrações** — Geração de código de barras, balança e impressora ESC/POS`,
    version: '1.0.0',
  },
  servers: [{ url: '/api', description: 'Servidor local' }],
  tags: [
    { name: 'Clientes', description: 'Cadastro e histórico de clientes' },
    { name: 'Produtos', description: 'Catálogo, estoque e código de barras' },
    { name: 'Pedidos', description: 'Emissão e gestão de pedidos' },
    { name: 'Financeiro', description: 'Fluxo de caixa e lançamentos' },
    { name: 'Funcionários', description: 'RH, salários e férias' },
    { name: 'Integrações', description: 'Balança, impressora e código de barras' },
  ],
  components: {
    schemas: {
      Endereco: {
        type: 'object',
        required: ['logradouro', 'numero', 'bairro', 'cidade', 'estado', 'cep'],
        properties: {
          logradouro: { type: 'string', example: 'Rua das Flores' },
          numero: { type: 'string', example: '123' },
          complemento: { type: 'string', example: 'Apto 2' },
          bairro: { type: 'string', example: 'Centro' },
          cidade: { type: 'string', example: 'São Paulo' },
          estado: { type: 'string', minLength: 2, maxLength: 2, example: 'SP' },
          cep: { type: 'string', example: '01001-000' },
        },
      },
      Cliente: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nome: { type: 'string' },
          telefone: { type: 'string' },
          email: { type: 'string', format: 'email' },
          cpf_cnpj: { type: 'string' },
          endereco: { $ref: '#/components/schemas/Endereco' },
          total_pedidos: { type: 'integer' },
          criado_em: { type: 'string', format: 'date-time' },
          atualizado_em: { type: 'string', format: 'date-time' },
        },
      },
      CriarClienteDTO: {
        type: 'object',
        required: ['nome', 'telefone', 'endereco'],
        properties: {
          nome: { type: 'string', minLength: 2, example: 'João Silva' },
          telefone: { type: 'string', minLength: 10, example: '(11) 98765-4321' },
          email: { type: 'string', format: 'email', example: 'joao@email.com' },
          cpf_cnpj: { type: 'string', example: '123.456.789-00' },
          endereco: { $ref: '#/components/schemas/Endereco' },
        },
      },
      Produto: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nome: { type: 'string' },
          descricao: { type: 'string' },
          codigo_barras: { type: 'string' },
          preco_custo: { type: 'number', format: 'float' },
          preco_venda: { type: 'number', format: 'float' },
          estoque_atual: { type: 'number', format: 'float' },
          estoque_minimo: { type: 'number', format: 'float' },
          unidade: { type: 'string', enum: ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pc'] },
          categoria: { type: 'string' },
          ativo: { type: 'boolean' },
          criado_em: { type: 'string', format: 'date-time' },
          atualizado_em: { type: 'string', format: 'date-time' },
        },
      },
      CriarProdutoDTO: {
        type: 'object',
        required: ['nome', 'codigo_barras', 'preco_venda'],
        properties: {
          nome: { type: 'string', minLength: 2, example: 'Arroz Tipo 1 5kg' },
          descricao: { type: 'string', example: 'Arroz agulhinha longo fino' },
          codigo_barras: { type: 'string', example: '7891234567890' },
          preco_custo: { type: 'number', format: 'float', minimum: 0, example: 12.5 },
          preco_venda: { type: 'number', format: 'float', minimum: 0.01, example: 18.9 },
          estoque_atual: { type: 'number', format: 'float', minimum: 0, default: 0, example: 50 },
          estoque_minimo: { type: 'number', format: 'float', minimum: 0, default: 0, example: 10 },
          unidade: { type: 'string', enum: ['un', 'kg', 'g', 'l', 'ml', 'cx', 'pc'], default: 'un' },
          categoria: { type: 'string', example: 'Alimentos' },
        },
      },
      MovimentacaoEstoqueDTO: {
        type: 'object',
        required: ['tipo', 'quantidade', 'motivo'],
        properties: {
          tipo: { type: 'string', enum: ['entrada', 'saida', 'ajuste'], example: 'entrada' },
          quantidade: { type: 'number', format: 'float', minimum: 0.001, example: 20 },
          motivo: { type: 'string', minLength: 3, example: 'Compra fornecedor' },
        },
      },
      ItemPedidoDTO: {
        type: 'object',
        required: ['produto_id', 'quantidade', 'preco_unitario'],
        properties: {
          produto_id: { type: 'integer', example: 1 },
          quantidade: { type: 'number', format: 'float', minimum: 0.001, example: 2 },
          preco_unitario: { type: 'number', format: 'float', minimum: 0.01, example: 18.9 },
        },
      },
      ItemPedido: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          pedido_id: { type: 'integer' },
          produto_id: { type: 'integer' },
          produto_nome: { type: 'string' },
          quantidade: { type: 'number', format: 'float' },
          preco_unitario: { type: 'number', format: 'float' },
          subtotal: { type: 'number', format: 'float' },
        },
      },
      Pedido: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          cliente_id: { type: 'integer', nullable: true },
          status: { type: 'string', enum: ['aberto', 'confirmado', 'em_preparo', 'pronto', 'entregue', 'cancelado'] },
          itens: { type: 'array', items: { $ref: '#/components/schemas/ItemPedido' } },
          subtotal: { type: 'number', format: 'float' },
          desconto: { type: 'number', format: 'float' },
          total: { type: 'number', format: 'float' },
          observacoes: { type: 'string', nullable: true },
          criado_em: { type: 'string', format: 'date-time' },
          atualizado_em: { type: 'string', format: 'date-time' },
        },
      },
      CriarPedidoDTO: {
        type: 'object',
        required: ['itens'],
        properties: {
          cliente_id: { type: 'integer', example: 1 },
          itens: { type: 'array', minItems: 1, items: { $ref: '#/components/schemas/ItemPedidoDTO' } },
          desconto: { type: 'number', format: 'float', minimum: 0, default: 0, example: 5.0 },
          observacoes: { type: 'string', example: 'Sem cebola' },
        },
      },
      AtualizarStatusPedidoDTO: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', enum: ['confirmado', 'em_preparo', 'pronto', 'entregue', 'cancelado'], example: 'confirmado' },
        },
      },
      LancamentoFinanceiro: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          tipo: { type: 'string', enum: ['receita', 'despesa'] },
          categoria: { type: 'string' },
          descricao: { type: 'string' },
          valor: { type: 'number', format: 'float' },
          data_lancamento: { type: 'string', format: 'date' },
          referencia_id: { type: 'integer', nullable: true },
          criado_em: { type: 'string', format: 'date-time' },
        },
      },
      CriarLancamentoDTO: {
        type: 'object',
        required: ['tipo', 'categoria', 'descricao', 'valor'],
        properties: {
          tipo: { type: 'string', enum: ['receita', 'despesa'], example: 'despesa' },
          categoria: { type: 'string', minLength: 2, example: 'Fornecedores' },
          descricao: { type: 'string', minLength: 3, example: 'Compra de mercadoria' },
          valor: { type: 'number', format: 'float', minimum: 0.01, example: 350.00 },
          data_lancamento: { type: 'string', format: 'date', example: '2026-06-03' },
        },
      },
      Funcionario: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nome: { type: 'string' },
          cpf: { type: 'string' },
          cargo: { type: 'string' },
          salario_base: { type: 'number', format: 'float' },
          data_admissao: { type: 'string', format: 'date' },
          data_demissao: { type: 'string', format: 'date', nullable: true },
          ativo: { type: 'boolean' },
          criado_em: { type: 'string', format: 'date-time' },
        },
      },
      CriarFuncionarioDTO: {
        type: 'object',
        required: ['nome', 'cpf', 'cargo', 'salario_base', 'data_admissao'],
        properties: {
          nome: { type: 'string', minLength: 2, example: 'Maria Oliveira' },
          cpf: { type: 'string', example: '123.456.789-09' },
          cargo: { type: 'string', minLength: 2, example: 'Vendedor(a)' },
          salario_base: { type: 'number', format: 'float', minimum: 0.01, example: 2500.00 },
          data_admissao: { type: 'string', format: 'date', example: '2025-01-10' },
        },
      },
      InssCalculo: {
        type: 'object',
        properties: {
          base_calculo: { type: 'number', format: 'float' },
          aliquota: { type: 'number', format: 'float', description: 'Alíquota efetiva' },
          valor: { type: 'number', format: 'float' },
          descricao: { type: 'string' },
        },
      },
      IrrfCalculo: {
        type: 'object',
        properties: {
          base_calculo: { type: 'number', format: 'float' },
          aliquota: { type: 'number', format: 'float' },
          deducao: { type: 'number', format: 'float' },
          valor: { type: 'number', format: 'float' },
          faixa: { type: 'string', description: 'Ex: Isento, 7,5%, 15%, 22,5%, 27,5%' },
        },
      },
      CalculoSalario: {
        type: 'object',
        properties: {
          funcionario_id: { type: 'integer' },
          nome: { type: 'string' },
          mes_referencia: { type: 'string', example: '2026-06' },
          salario_base: { type: 'number', format: 'float' },
          inss: { $ref: '#/components/schemas/InssCalculo' },
          irrf: { $ref: '#/components/schemas/IrrfCalculo' },
          outros_descontos: { type: 'number', format: 'float' },
          outros_beneficios: { type: 'number', format: 'float' },
          salario_liquido: { type: 'number', format: 'float' },
        },
      },
      CalcularSalarioDTO: {
        type: 'object',
        required: ['funcionario_id', 'mes_referencia'],
        properties: {
          funcionario_id: { type: 'integer', example: 1 },
          mes_referencia: { type: 'string', pattern: '^\\d{4}-\\d{2}$', example: '2026-06' },
          outros_descontos: { type: 'number', format: 'float', minimum: 0, default: 0, example: 0 },
          outros_beneficios: { type: 'number', format: 'float', minimum: 0, default: 0, example: 200 },
        },
      },
      CalculoFerias: {
        type: 'object',
        properties: {
          funcionario_id: { type: 'integer' },
          nome: { type: 'string' },
          periodo_aquisitivo: {
            type: 'object',
            properties: {
              inicio: { type: 'string', format: 'date' },
              fim: { type: 'string', format: 'date' },
            },
          },
          dias_ferias: { type: 'integer' },
          salario_base: { type: 'number', format: 'float' },
          valor_ferias: { type: 'number', format: 'float' },
          abono_pecuniario: { type: 'number', format: 'float' },
          total_bruto: { type: 'number', format: 'float' },
          inss: { type: 'number', format: 'float' },
          irrf: { type: 'number', format: 'float' },
          total_liquido: { type: 'number', format: 'float' },
        },
      },
      CalcularFeriasDTO: {
        type: 'object',
        required: ['funcionario_id'],
        properties: {
          funcionario_id: { type: 'integer', example: 1 },
          dias_ferias: { type: 'integer', minimum: 5, maximum: 30, default: 30, example: 30 },
          abono_pecuniario: { type: 'boolean', default: false, description: 'Vender 10 dias de férias (abono de 1/3)' },
        },
      },
      DemitirDTO: {
        type: 'object',
        required: ['data_demissao'],
        properties: {
          data_demissao: { type: 'string', format: 'date', example: '2026-06-03' },
        },
      },
      ImprimirPedidoDTO: {
        type: 'object',
        required: ['pedido_id'],
        properties: {
          pedido_id: { type: 'integer', example: 1 },
          copias: { type: 'integer', minimum: 1, maximum: 10, default: 1, example: 1 },
        },
      },
      Paginacao: {
        type: 'object',
        properties: {
          page: { type: 'integer' },
          pageSize: { type: 'integer' },
          total: { type: 'integer' },
          totalPages: { type: 'integer' },
        },
      },
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {},
          message: { type: 'string' },
          errors: { type: 'array', items: { type: 'string' } },
          pagination: { $ref: '#/components/schemas/Paginacao' },
        },
      },
      Erro: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string', example: 'Recurso não encontrado' },
        },
      },
    },
    responses: {
      NotFound: {
        description: 'Recurso não encontrado',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
      },
      BadRequest: {
        description: 'Dados inválidos',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
      },
      Conflict: {
        description: 'Conflito de dados (ex: duplicata)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } },
      },
    },
    parameters: {
      page: { name: 'page', in: 'query', schema: { type: 'integer', default: 1, minimum: 1 }, description: 'Página' },
      pageSize: { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20, minimum: 1, maximum: 100 }, description: 'Itens por página' },
      busca: { name: 'busca', in: 'query', schema: { type: 'string' }, description: 'Texto de busca' },
      idParam: { name: 'id', in: 'path', required: true, schema: { type: 'integer' }, description: 'ID do recurso' },
      dataInicio: { name: 'data_inicio', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data inicial (AAAA-MM-DD)' },
      dataFim: { name: 'data_fim', in: 'query', schema: { type: 'string', format: 'date' }, description: 'Data final (AAAA-MM-DD)' },
    },
  },
  paths: {
    '/health': {
      get: {
        summary: 'Status da API',
        tags: ['Clientes'],
        responses: {
          200: { description: 'API online', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'ok' }, timestamp: { type: 'string', format: 'date-time' } } } } } },
        },
      },
    },

    // ── CLIENTES ──────────────────────────────────────────────────────────
    '/clientes': {
      get: {
        summary: 'Listar clientes',
        tags: ['Clientes'],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/pageSize' },
          { $ref: '#/components/parameters/busca' },
        ],
        responses: {
          200: {
            description: 'Lista paginada de clientes',
            content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Cliente' } } } }] } } },
          },
        },
      },
      post: {
        summary: 'Criar cliente',
        tags: ['Clientes'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarClienteDTO' } } } },
        responses: {
          201: { description: 'Cliente criado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Cliente' } } }] } } } },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/clientes/{id}': {
      get: {
        summary: 'Buscar cliente por ID',
        tags: ['Clientes'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: { description: 'Cliente encontrado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Cliente' } } }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        summary: 'Atualizar cliente',
        tags: ['Clientes'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarClienteDTO' } } } },
        responses: {
          200: { description: 'Cliente atualizado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Cliente' } } }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Remover cliente',
        description: 'Remove o cliente. Falha com 409 se houver pedidos vinculados.',
        tags: ['Clientes'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: { description: 'Cliente removido' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/clientes/{id}/historico': {
      get: {
        summary: 'Histórico de pedidos do cliente',
        tags: ['Clientes'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: {
            description: 'Histórico com pedidos e total gasto',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/ApiResponse' }, {
                    type: 'object', properties: {
                      data: {
                        type: 'object', properties: {
                          cliente: { $ref: '#/components/schemas/Cliente' },
                          total_gasto: { type: 'number', format: 'float' },
                          pedidos: { type: 'array', items: { $ref: '#/components/schemas/Pedido' } },
                        },
                      },
                    },
                  }],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── PRODUTOS ──────────────────────────────────────────────────────────
    '/produtos': {
      get: {
        summary: 'Listar produtos',
        tags: ['Produtos'],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/pageSize' },
          { $ref: '#/components/parameters/busca' },
          { name: 'categoria', in: 'query', schema: { type: 'string' }, description: 'Filtrar por categoria' },
          { name: 'estoqueBaixo', in: 'query', schema: { type: 'boolean' }, description: 'Somente produtos abaixo do estoque mínimo' },
        ],
        responses: {
          200: { description: 'Lista paginada de produtos', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Produto' } } } }] } } } },
        },
      },
      post: {
        summary: 'Criar produto',
        tags: ['Produtos'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarProdutoDTO' } } } },
        responses: {
          201: { description: 'Produto criado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Produto' } } }] } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/produtos/estoque-baixo': {
      get: {
        summary: 'Produtos com estoque abaixo do mínimo',
        tags: ['Produtos'],
        responses: {
          200: { description: 'Lista de produtos com estoque baixo', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Produto' } } } }] } } } },
        },
      },
    },
    '/produtos/codigo/{codigo}': {
      get: {
        summary: 'Buscar produto por código de barras',
        tags: ['Produtos'],
        parameters: [{ name: 'codigo', in: 'path', required: true, schema: { type: 'string' }, description: 'Código de barras', example: '7891234567890' }],
        responses: {
          200: { description: 'Produto encontrado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Produto' } } }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/produtos/{id}': {
      get: {
        summary: 'Buscar produto por ID',
        tags: ['Produtos'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: { description: 'Produto encontrado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Produto' } } }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        summary: 'Atualizar produto',
        tags: ['Produtos'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarProdutoDTO' } } } },
        responses: {
          200: { description: 'Produto atualizado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Produto' } } }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      delete: {
        summary: 'Desativar produto (soft delete)',
        tags: ['Produtos'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: { description: 'Produto desativado' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/produtos/{id}/estoque': {
      get: {
        summary: 'Histórico de movimentações do estoque',
        tags: ['Produtos'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: {
            description: 'Movimentações do produto',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/ApiResponse' }, {
                    type: 'object', properties: {
                      data: {
                        type: 'array', items: {
                          type: 'object', properties: {
                            id: { type: 'integer' }, produto_id: { type: 'integer' },
                            tipo: { type: 'string', enum: ['entrada', 'saida', 'ajuste'] },
                            quantidade: { type: 'number' }, motivo: { type: 'string' },
                            criado_em: { type: 'string', format: 'date-time' },
                          },
                        },
                      },
                    },
                  }],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/produtos/{id}/movimentar': {
      post: {
        summary: 'Registrar movimentação de estoque',
        description: '**entrada**: soma quantidade | **saida**: subtrai quantidade | **ajuste**: define quantidade absoluta',
        tags: ['Produtos'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/MovimentacaoEstoqueDTO' } } } },
        responses: {
          201: { description: 'Movimentação registrada' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { description: 'Estoque insuficiente para saída', content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } } },
        },
      },
    },
    '/produtos/{id}/ean13': {
      get: {
        summary: 'Gerar código EAN-13 para o produto',
        description: 'Gera um código EAN-13 com prefixo 789 (Brasil) baseado no ID do produto.',
        tags: ['Produtos'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: {
            description: 'EAN-13 gerado',
            content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { type: 'object', properties: { produto_id: { type: 'integer' }, ean13: { type: 'string', example: '7890000000013' } } } } }] } } },
          },
        },
      },
    },

    // ── PEDIDOS ───────────────────────────────────────────────────────────
    '/pedidos': {
      get: {
        summary: 'Listar pedidos',
        tags: ['Pedidos'],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/pageSize' },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['aberto', 'confirmado', 'em_preparo', 'pronto', 'entregue', 'cancelado'] } },
          { name: 'cliente_id', in: 'query', schema: { type: 'integer' } },
          { $ref: '#/components/parameters/dataInicio' },
          { $ref: '#/components/parameters/dataFim' },
        ],
        responses: {
          200: { description: 'Lista paginada de pedidos', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Pedido' } } } }] } } } },
        },
      },
      post: {
        summary: 'Criar pedido',
        description: 'Cria um pedido, desconta estoque automaticamente e registra movimentações.',
        tags: ['Pedidos'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarPedidoDTO' } } } },
        responses: {
          201: { description: 'Pedido criado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Pedido' } } }] } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          422: { description: 'Estoque insuficiente', content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } } },
        },
      },
    },
    '/pedidos/resumo': {
      get: {
        summary: 'Resumo de vendas por período',
        tags: ['Pedidos'],
        parameters: [
          { $ref: '#/components/parameters/dataInicio' },
          { $ref: '#/components/parameters/dataFim' },
        ],
        responses: {
          200: {
            description: 'Resumo do período',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/ApiResponse' }, {
                    type: 'object', properties: {
                      data: {
                        type: 'object', properties: {
                          total_pedidos: { type: 'integer' },
                          entregues: { type: 'integer' },
                          cancelados: { type: 'integer' },
                          receita_total: { type: 'number', format: 'float' },
                        },
                      },
                    },
                  }],
                },
              },
            },
          },
        },
      },
    },
    '/pedidos/{id}': {
      get: {
        summary: 'Buscar pedido por ID',
        tags: ['Pedidos'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: { description: 'Pedido encontrado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Pedido' } } }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/pedidos/{id}/status': {
      patch: {
        summary: 'Atualizar status do pedido',
        description: `**Fluxo permitido:**
- aberto → confirmado | cancelado
- confirmado → em_preparo | cancelado
- em_preparo → pronto | cancelado
- pronto → entregue | cancelado
- entregue → (final)
- cancelado → (final, estoque devolvido)

Ao atingir **entregue**, um lançamento de receita é criado automaticamente no financeiro.`,
        tags: ['Pedidos'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/AtualizarStatusPedidoDTO' } } } },
        responses: {
          200: { description: 'Status atualizado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Pedido' } } }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
          422: { description: 'Transição de status inválida', content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } } },
        },
      },
    },

    // ── FINANCEIRO ────────────────────────────────────────────────────────
    '/financeiro': {
      get: {
        summary: 'Listar lançamentos financeiros',
        tags: ['Financeiro'],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/pageSize' },
          { $ref: '#/components/parameters/dataInicio' },
          { $ref: '#/components/parameters/dataFim' },
          { name: 'tipo', in: 'query', schema: { type: 'string', enum: ['receita', 'despesa'] } },
          { name: 'categoria', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Lista paginada de lançamentos', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/LancamentoFinanceiro' } } } }] } } } },
        },
      },
      post: {
        summary: 'Criar lançamento financeiro',
        tags: ['Financeiro'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarLancamentoDTO' } } } },
        responses: {
          201: { description: 'Lançamento criado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/LancamentoFinanceiro' } } }] } } } },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/financeiro/fluxo-caixa': {
      get: {
        summary: 'Resumo do fluxo de caixa',
        description: 'Retorna receitas, despesas e saldo do período (padrão: mês atual).',
        tags: ['Financeiro'],
        parameters: [
          { $ref: '#/components/parameters/dataInicio' },
          { $ref: '#/components/parameters/dataFim' },
        ],
        responses: {
          200: {
            description: 'Resumo financeiro',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/ApiResponse' }, {
                    type: 'object', properties: {
                      data: {
                        type: 'object', properties: {
                          periodo: { type: 'string' },
                          total_receitas: { type: 'number', format: 'float' },
                          total_despesas: { type: 'number', format: 'float' },
                          saldo: { type: 'number', format: 'float' },
                          lancamentos: { type: 'array', items: { $ref: '#/components/schemas/LancamentoFinanceiro' } },
                        },
                      },
                    },
                  }],
                },
              },
            },
          },
        },
      },
    },
    '/financeiro/diario': {
      get: {
        summary: 'Fluxo de caixa diário',
        description: 'Agrupa receitas e despesas dia a dia no período.',
        tags: ['Financeiro'],
        parameters: [
          { $ref: '#/components/parameters/dataInicio' },
          { $ref: '#/components/parameters/dataFim' },
        ],
        responses: {
          200: {
            description: 'Fluxo diário',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/ApiResponse' }, {
                    type: 'object', properties: {
                      data: {
                        type: 'array', items: {
                          type: 'object', properties: {
                            data: { type: 'string', format: 'date' },
                            receitas: { type: 'number', format: 'float' },
                            despesas: { type: 'number', format: 'float' },
                          },
                        },
                      },
                    },
                  }],
                },
              },
            },
          },
        },
      },
    },
    '/financeiro/categorias': {
      get: {
        summary: 'Resumo por categoria',
        description: 'Agrupa lançamentos por tipo e categoria no período.',
        tags: ['Financeiro'],
        parameters: [
          { $ref: '#/components/parameters/dataInicio' },
          { $ref: '#/components/parameters/dataFim' },
        ],
        responses: {
          200: {
            description: 'Resumo por categoria',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/ApiResponse' }, {
                    type: 'object', properties: {
                      data: {
                        type: 'array', items: {
                          type: 'object', properties: {
                            tipo: { type: 'string' }, categoria: { type: 'string' },
                            total: { type: 'number', format: 'float' }, qtd: { type: 'integer' },
                          },
                        },
                      },
                    },
                  }],
                },
              },
            },
          },
        },
      },
    },
    '/financeiro/{id}': {
      delete: {
        summary: 'Remover lançamento financeiro',
        description: 'Lançamentos gerados automaticamente por vendas (pedido entregue) não podem ser removidos manualmente.',
        tags: ['Financeiro'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: { description: 'Lançamento removido' },
          404: { $ref: '#/components/responses/NotFound' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },

    // ── FUNCIONÁRIOS ──────────────────────────────────────────────────────
    '/funcionarios': {
      get: {
        summary: 'Listar funcionários',
        tags: ['Funcionários'],
        parameters: [
          { $ref: '#/components/parameters/page' },
          { $ref: '#/components/parameters/pageSize' },
          { $ref: '#/components/parameters/busca' },
          { name: 'ativo', in: 'query', schema: { type: 'boolean' }, description: 'Filtrar por situação (true = ativo, false = demitido)' },
        ],
        responses: {
          200: { description: 'Lista paginada de funcionários', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/Funcionario' } } } }] } } } },
        },
      },
      post: {
        summary: 'Cadastrar funcionário',
        tags: ['Funcionários'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarFuncionarioDTO' } } } },
        responses: {
          201: { description: 'Funcionário cadastrado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Funcionario' } } }] } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          409: { $ref: '#/components/responses/Conflict' },
        },
      },
    },
    '/funcionarios/{id}': {
      get: {
        summary: 'Buscar funcionário por ID',
        tags: ['Funcionários'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        responses: {
          200: { description: 'Funcionário encontrado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Funcionario' } } }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        summary: 'Atualizar dados do funcionário',
        tags: ['Funcionários'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CriarFuncionarioDTO' } } } },
        responses: {
          200: { description: 'Funcionário atualizado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Funcionario' } } }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/funcionarios/{id}/demitir': {
      post: {
        summary: 'Registrar demissão',
        description: 'Marca o funcionário como inativo e registra a data de demissão.',
        tags: ['Funcionários'],
        parameters: [{ $ref: '#/components/parameters/idParam' }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/DemitirDTO' } } },
        },
        responses: {
          200: { description: 'Demissão registrada', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/Funcionario' } } }] } } } },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/funcionarios/calcular-salario': {
      post: {
        summary: 'Calcular salário líquido',
        description: 'Calcula salário com descontos de INSS (tabela progressiva 2024) e IRRF.',
        tags: ['Funcionários'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CalcularSalarioDTO' } } } },
        responses: {
          200: { description: 'Holerite calculado', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/CalculoSalario' } } }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/funcionarios/calcular-ferias': {
      post: {
        summary: 'Calcular férias',
        description: 'Calcula o valor de férias com 1/3 constitucional e abono pecuniário opcional (venda de 10 dias).',
        tags: ['Funcionários'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CalcularFeriasDTO' } } } },
        responses: {
          200: { description: 'Cálculo de férias', content: { 'application/json': { schema: { allOf: [{ $ref: '#/components/schemas/ApiResponse' }, { type: 'object', properties: { data: { $ref: '#/components/schemas/CalculoFerias' } } }] } } } },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },

    // ── INTEGRAÇÕES ───────────────────────────────────────────────────────
    '/barcode': {
      get: {
        summary: 'Gerar imagem de código de barras (SVG)',
        description: 'Retorna um SVG com o código de barras renderizado. Compatible com CODE128 e EAN13.',
        tags: ['Integrações'],
        parameters: [
          { name: 'codigo', in: 'query', required: true, schema: { type: 'string' }, description: 'Código a renderizar', example: '7891234567890' },
          { name: 'formato', in: 'query', schema: { type: 'string', enum: ['CODE128', 'EAN13'], default: 'CODE128' } },
          { name: 'largura', in: 'query', schema: { type: 'integer', default: 2 }, description: 'Largura de cada barra (px)' },
          { name: 'altura', in: 'query', schema: { type: 'integer', default: 100 }, description: 'Altura das barras (px)' },
        ],
        responses: {
          200: { description: 'Imagem SVG do código de barras', content: { 'image/svg+xml': { schema: { type: 'string' } } } },
          400: { $ref: '#/components/responses/BadRequest' },
        },
      },
    },
    '/balanca/{codigo}': {
      post: {
        summary: 'Enviar produto para balança',
        description: 'Envia os dados do produto (código, nome, preço) para a balança via TCP. Configure `BALANCA_HOST` e `BALANCA_PORT` no `.env`.',
        tags: ['Integrações'],
        parameters: [{ name: 'codigo', in: 'path', required: true, schema: { type: 'string' }, description: 'Código de barras do produto' }],
        responses: {
          200: {
            description: 'Dados enviados à balança',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/ApiResponse' }, {
                    type: 'object', properties: {
                      data: {
                        type: 'object', properties: {
                          sucesso: { type: 'boolean' },
                          mensagem: { type: 'string' },
                          produto: { type: 'object', properties: { codigo_barras: { type: 'string' }, nome: { type: 'string' }, preco_venda: { type: 'number' } } },
                        },
                      },
                    },
                  }],
                },
              },
            },
          },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/imprimir': {
      post: {
        summary: 'Imprimir cupom do pedido',
        description: 'Envia o cupom ESC/POS para a impressora via TCP. Configure `PRINTER_HOST` e `PRINTER_PORT` no `.env`. Retorna sucesso mesmo se a impressora estiver offline (detalhado na mensagem).',
        tags: ['Integrações'],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ImprimirPedidoDTO' } } } },
        responses: {
          200: {
            description: 'Resultado da impressão',
            content: {
              'application/json': {
                schema: {
                  allOf: [{ $ref: '#/components/schemas/ApiResponse' }, {
                    type: 'object', properties: {
                      data: {
                        type: 'object', properties: {
                          sucesso: { type: 'boolean' },
                          mensagem: { type: 'string', example: 'Pedido #1 impresso (1x)' },
                        },
                      },
                    },
                  }],
                },
              },
            },
          },
          400: { $ref: '#/components/responses/BadRequest' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
  },
};

export const swaggerUiOptions: SwaggerUiOptions = {
  customSiteTitle: 'Gestão Comercial — API Docs',
  customCss: `.swagger-ui .topbar { background-color: #1a1a2e; } .swagger-ui .topbar-wrapper img { display: none; } .swagger-ui .topbar-wrapper::before { content: '🏪 Gestão Comercial'; color: white; font-size: 1.2rem; font-weight: bold; }`,
  swaggerOptions: { defaultModelsExpandDepth: -1, docExpansion: 'none', filter: true },
};
