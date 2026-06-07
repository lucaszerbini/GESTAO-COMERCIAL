import { db } from '../models/database';
import { AppError } from '../middlewares/validar';
import { Produto, MovimentacaoEstoque } from '../types';
import { CriarProdutoDTO } from '../models/schemas';

function toProduto(row: Record<string, unknown>): Produto {
  return { ...(row as unknown as Produto), ativo: row.ativo === 1 };
}

export function listarProdutos(params: {
  busca?: string;
  categoria?: string;
  estoqueBaixo?: boolean;
  page: number;
  pageSize: number;
}) {
  const offset = (params.page - 1) * params.pageSize;
  const condicoes: string[] = ['ativo=1'];
  const args: unknown[] = [];

  if (params.busca) {
    const termo = `%${params.busca}%`;
    condicoes.push('(nome LIKE ? OR codigo_barras LIKE ?)');
    args.push(termo, termo);
  }
  if (params.categoria) {
    condicoes.push('categoria=?');
    args.push(params.categoria);
  }
  if (params.estoqueBaixo) {
    condicoes.push('estoque_atual<=estoque_minimo');
  }

  const where = `WHERE ${condicoes.join(' AND ')}`;
  const total = (db.prepare(`SELECT COUNT(*) as n FROM produtos ${where}`).get(...args) as { n: number }).n;
  const rows = db.prepare(`SELECT * FROM produtos ${where} ORDER BY nome LIMIT ? OFFSET ?`).all(...args, params.pageSize, offset) as Record<string, unknown>[];

  return { produtos: rows.map(toProduto), total };
}

export function buscarProdutoPorId(id: number): Produto {
  const row = db.prepare('SELECT * FROM produtos WHERE id=? AND ativo=1').get(id) as Record<string, unknown> | undefined;
  if (!row) throw new AppError(`Produto #${id} não encontrado`, 404);
  return toProduto(row);
}

export function buscarProdutoPorCodigoBarras(codigo: string): Produto {
  const row = db.prepare('SELECT * FROM produtos WHERE codigo_barras=? AND ativo=1').get(codigo) as Record<string, unknown> | undefined;
  if (!row) throw new AppError(`Produto "${codigo}" não encontrado`, 404);
  return toProduto(row);
}

export function criarProduto(dados: CriarProdutoDTO): Produto {
  if (db.prepare('SELECT id FROM produtos WHERE codigo_barras=?').get(dados.codigo_barras)) {
    throw new AppError('Código de barras já cadastrado', 409);
  }

  const resultado = db.prepare(`
    INSERT INTO produtos (nome, descricao, codigo_barras, preco_custo, preco_venda, estoque_atual, estoque_minimo, unidade, categoria)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    dados.nome, dados.descricao ?? null, dados.codigo_barras,
    dados.preco_custo, dados.preco_venda,
    dados.estoque_atual, dados.estoque_minimo,
    dados.unidade, dados.categoria ?? null,
  );

  const id = (resultado as any).lastInsertRowid as number;

  if (dados.estoque_atual > 0) {
    db.prepare(`INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo) VALUES (?, 'entrada', ?, 'Cadastro inicial')`).run(id, dados.estoque_atual);
  }

  return buscarProdutoPorId(id);
}

export function atualizarProduto(id: number, dados: Partial<CriarProdutoDTO>): Produto {
  buscarProdutoPorId(id);

  const campos: string[] = [];
  const valores: unknown[] = [];

  const mapa: Record<string, unknown> = {
    nome: dados.nome,
    descricao: dados.descricao,
    codigo_barras: dados.codigo_barras,
    preco_custo: dados.preco_custo,
    preco_venda: dados.preco_venda,
    estoque_minimo: dados.estoque_minimo,
    unidade: dados.unidade,
    categoria: dados.categoria,
  };

  for (const [campo, valor] of Object.entries(mapa)) {
    if (valor !== undefined) {
      campos.push(`${campo}=?`);
      valores.push(valor);
    }
  }

  if (!campos.length) throw new AppError('Nenhum campo para atualizar');

  campos.push(`atualizado_em=datetime('now','localtime')`);
  valores.push(id);

  db.prepare(`UPDATE produtos SET ${campos.join(', ')} WHERE id=?`).run(...valores);
  return buscarProdutoPorId(id);
}

export function removerProduto(id: number): void {
  buscarProdutoPorId(id);
  db.prepare(`UPDATE produtos SET ativo=0, atualizado_em=datetime('now','localtime') WHERE id=?`).run(id);
}

export function movimentarEstoque(dados: {
  produto_id: number;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  motivo: string;
  referencia_id?: number;
}) {
  const produto = buscarProdutoPorId(dados.produto_id);

  if (dados.tipo === 'saida' && produto.estoque_atual < dados.quantidade) {
    throw new AppError(`Estoque insuficiente. Disponível: ${produto.estoque_atual}`, 422);
  }

  let novoEstoque: number;
  if (dados.tipo === 'ajuste') {
    novoEstoque = dados.quantidade;
  } else if (dados.tipo === 'entrada') {
    novoEstoque = produto.estoque_atual + dados.quantidade;
  } else {
    novoEstoque = produto.estoque_atual - dados.quantidade;
  }

  db.prepare(`UPDATE produtos SET estoque_atual=?, atualizado_em=datetime('now','localtime') WHERE id=?`).run(novoEstoque, dados.produto_id);

  const inserido = db.prepare(`
    INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo, referencia_id)
    VALUES (?, ?, ?, ?, ?)
  `).run(dados.produto_id, dados.tipo, dados.quantidade, dados.motivo, dados.referencia_id ?? null);

  const movimentacao = db.prepare('SELECT * FROM movimentacoes_estoque WHERE id=?').get((inserido as any).lastInsertRowid) as MovimentacaoEstoque;
  return { produto: buscarProdutoPorId(dados.produto_id), movimentacao };
}

export function historicoEstoque(produto_id: number, limite = 50): MovimentacaoEstoque[] {
  buscarProdutoPorId(produto_id);
  return db.prepare(`SELECT * FROM movimentacoes_estoque WHERE produto_id=? ORDER BY criado_em DESC LIMIT ?`).all(produto_id, limite) as MovimentacaoEstoque[];
}

export function produtosComEstoqueBaixo(): Produto[] {
  const rows = db.prepare(`SELECT * FROM produtos WHERE ativo=1 AND estoque_atual<=estoque_minimo ORDER BY nome`).all() as Record<string, unknown>[];
  return rows.map(toProduto);
}
