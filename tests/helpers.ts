// Helpers para os testes
import { db } from '../src/models/database';

export function cleanDb() {
  db.exec(`
    DELETE FROM itens_pedido;
    DELETE FROM movimentacoes_estoque;
    DELETE FROM lancamentos_financeiros;
    DELETE FROM pedidos;
    DELETE FROM produtos;
    DELETE FROM clientes;
    DELETE FROM funcionarios;
  `);
}

export const clienteBase = {
  nome: 'João Teste',
  telefone: '(11) 99999-0001',
  email: 'joao@teste.com',
  endereco: {
    logradouro: 'Rua das Flores',
    numero: '10',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01001-000',
  },
};

export const produtoBase = {
  nome: 'Produto Teste',
  codigo_barras: '7890000000001',
  preco_custo: 10.0,
  preco_venda: 15.0,
  estoque_atual: 50,
  estoque_minimo: 5,
  unidade: 'un',
  categoria: 'Teste',
};

export const funcionarioBase = {
  nome: 'Maria Silva',
  cpf: '123.456.789-09',
  cargo: 'Vendedor',
  salario_base: 2500.00,
  data_admissao: '2025-01-10',
};
