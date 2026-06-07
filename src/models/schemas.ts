import { z } from 'zod';

export const enderecoSchema = z.object({
  logradouro: z.string().min(3),
  numero: z.string().min(1),
  complemento: z.string().optional(),
  bairro: z.string().min(2),
  cidade: z.string().min(2),
  estado: z.string().length(2).toUpperCase(),
  cep: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
});

export const criarClienteSchema = z.object({
  nome: z.string().min(2),
  telefone: z.string().min(10),
  email: z.string().email().optional(),
  cpf_cnpj: z.string().optional(),
  endereco: enderecoSchema,
});

export const atualizarClienteSchema = criarClienteSchema.partial();

export const criarProdutoSchema = z.object({
  nome: z.string().min(2),
  descricao: z.string().optional(),
  codigo_barras: z.string().min(4),
  preco_custo: z.number().nonnegative(),
  preco_venda: z.number().positive(),
  estoque_atual: z.number().nonnegative().default(0),
  estoque_minimo: z.number().nonnegative().default(0),
  unidade: z.enum(['un', 'kg', 'g', 'l', 'ml', 'cx', 'pc']).default('un'),
  categoria: z.string().optional(),
});

export const atualizarProdutoSchema = criarProdutoSchema.partial();

export const movimentacaoEstoqueSchema = z.object({
  tipo: z.enum(['entrada', 'saida', 'ajuste']),
  quantidade: z.number().positive(),
  motivo: z.string().min(3),
});

export const itemPedidoSchema = z.object({
  produto_id: z.number().int().positive(),
  quantidade: z.number().positive(),
  preco_unitario: z.number().positive(),
});

export const criarPedidoSchema = z.object({
  cliente_id: z.number().int().positive().optional(),
  itens: z.array(itemPedidoSchema).min(1),
  desconto: z.number().nonnegative().default(0),
  observacoes: z.string().optional(),
});

export const atualizarStatusPedidoSchema = z.object({
  status: z.enum(['aberto', 'confirmado', 'em_preparo', 'pronto', 'entregue', 'cancelado']),
});

export const criarLancamentoSchema = z.object({
  tipo: z.enum(['receita', 'despesa']),
  categoria: z.string().min(2),
  descricao: z.string().min(3),
  valor: z.number().positive(),
  data_lancamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const criarFuncionarioSchema = z.object({
  nome: z.string().min(2),
  cpf: z.string().regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, 'CPF inválido'),
  cargo: z.string().min(2),
  salario_base: z.number().positive(),
  data_admissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const atualizarFuncionarioSchema = criarFuncionarioSchema.partial();

export const calcularSalarioSchema = z.object({
  funcionario_id: z.number().int().positive(),
  mes_referencia: z.string().regex(/^\d{4}-\d{2}$/),
  outros_descontos: z.number().nonnegative().default(0),
  outros_beneficios: z.number().nonnegative().default(0),
});

export const calcularFeriasSchema = z.object({
  funcionario_id: z.number().int().positive(),
  dias_ferias: z.number().int().min(5).max(30).default(30),
  abono_pecuniario: z.boolean().default(false),
});

export const demitirFuncionarioSchema = z.object({
  data_demissao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use AAAA-MM-DD)'),
});

export const imprimirPedidoSchema = z.object({
  pedido_id: z.number().int().positive(),
  copias: z.number().int().min(1).max(10).default(1),
});

export type CriarClienteDTO = z.infer<typeof criarClienteSchema>;
export type CriarProdutoDTO = z.infer<typeof criarProdutoSchema>;
export type CriarPedidoDTO = z.infer<typeof criarPedidoSchema>;
export type CriarLancamentoDTO = z.infer<typeof criarLancamentoSchema>;
export type CriarFuncionarioDTO = z.infer<typeof criarFuncionarioSchema>;
export type CalcularSalarioDTO = z.infer<typeof calcularSalarioSchema>;
export type CalcularFeriasDTO = z.infer<typeof calcularFeriasSchema>;
export type DemitirFuncionarioDTO = z.infer<typeof demitirFuncionarioSchema>;
