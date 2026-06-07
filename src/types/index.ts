export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Endereco {
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  cep: string;
}

export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email?: string;
  cpf_cnpj?: string;
  endereco: Endereco;
  total_pedidos: number;
  criado_em: string;
  atualizado_em: string;
}

export interface Produto {
  id: number;
  nome: string;
  descricao?: string;
  codigo_barras: string;
  preco_custo: number;
  preco_venda: number;
  estoque_atual: number;
  estoque_minimo: number;
  unidade: 'un' | 'kg' | 'g' | 'l' | 'ml' | 'cx' | 'pc';
  categoria?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface MovimentacaoEstoque {
  id: number;
  produto_id: number;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  motivo: string;
  referencia_id?: number;
  criado_em: string;
}

export interface ItemPedido {
  id: number;
  pedido_id: number;
  produto_id: number;
  produto?: Produto;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  cliente_id?: number;
  cliente_nome?: string;
  cliente?: Cliente;
  status: 'aberto' | 'confirmado' | 'em_preparo' | 'pronto' | 'entregue' | 'cancelado';
  itens: ItemPedido[];
  subtotal: number;
  desconto: number;
  total: number;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface LancamentoFinanceiro {
  id: number;
  tipo: 'receita' | 'despesa';
  categoria: string;
  descricao: string;
  valor: number;
  data_lancamento: string;
  referencia_id?: number;
  criado_em: string;
}

export interface ResumoFinanceiro {
  periodo: string;
  total_receitas: number;
  total_despesas: number;
  saldo: number;
  lancamentos: LancamentoFinanceiro[];
}

export interface Funcionario {
  id: number;
  nome: string;
  cpf: string;
  cargo: string;
  salario_base: number;
  data_admissao: string;
  data_demissao?: string;
  ativo: boolean;
  criado_em: string;
}

export interface InssCalculo {
  base_calculo: number;
  aliquota: number;
  valor: number;
  descricao: string;
}

export interface IrrfCalculo {
  base_calculo: number;
  aliquota: number;
  deducao: number;
  valor: number;
  faixa: string;
}

export interface CalculoSalario {
  funcionario_id: number;
  nome: string;
  mes_referencia: string;
  salario_base: number;
  inss: InssCalculo;
  irrf: IrrfCalculo;
  outros_descontos: number;
  outros_beneficios: number;
  salario_liquido: number;
}

export interface CalculoFerias {
  funcionario_id: number;
  nome: string;
  periodo_aquisitivo: { inicio: string; fim: string };
  dias_ferias: number;
  salario_base: number;
  valor_ferias: number;
  abono_pecuniario: number;
  total_bruto: number;
  inss: number;
  irrf: number;
  total_liquido: number;
}
