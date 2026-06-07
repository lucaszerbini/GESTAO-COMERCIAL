import { db } from '../models/database';
import { AppError } from '../middlewares/validar';
import { Pedido, ItemPedido } from '../types';
import { CriarPedidoDTO } from '../models/schemas';
import { buscarProdutoPorId } from './produtoService';

function montarPedido(row: Record<string, unknown>): Pedido {
  const itens = db.prepare(`
    SELECT ip.*, p.nome as produto_nome, p.unidade
    FROM itens_pedido ip
    JOIN produtos p ON p.id = ip.produto_id
    WHERE ip.pedido_id = ?
  `).all(row.id as number) as unknown as ItemPedido[];
  return { ...(row as unknown as Pedido), itens };
}

export function listarPedidos(params: {
  status?: string;
  cliente_id?: number;
  data_inicio?: string;
  data_fim?: string;
  page: number;
  pageSize: number;
}) {
  const condicoes: string[] = [];
  const args: unknown[] = [];

  if (params.status)      { condicoes.push('ped.status=?');              args.push(params.status); }
  if (params.cliente_id)  { condicoes.push('ped.cliente_id=?');          args.push(params.cliente_id); }
  if (params.data_inicio) { condicoes.push('date(ped.criado_em)>=?');    args.push(params.data_inicio); }
  if (params.data_fim)    { condicoes.push('date(ped.criado_em)<=?');    args.push(params.data_fim); }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.pageSize;

  const total = (db.prepare(`SELECT COUNT(*) as n FROM pedidos ped ${where}`).get(...args) as { n: number }).n;
  const rows = db.prepare(`SELECT ped.*, c.nome as cliente_nome FROM pedidos ped LEFT JOIN clientes c ON c.id = ped.cliente_id ${where} ORDER BY ped.criado_em DESC LIMIT ? OFFSET ?`).all(...args, params.pageSize, offset) as Record<string, unknown>[];

  return { pedidos: rows.map(montarPedido), total };
}

export function buscarPedidoPorId(id: number): Pedido {
  const row = db.prepare('SELECT * FROM pedidos WHERE id=?').get(id) as Record<string, unknown> | undefined;
  if (!row) throw new AppError(`Pedido #${id} não encontrado`, 404);
  return montarPedido(row);
}

export function criarPedido(dados: CriarPedidoDTO): Pedido {
  const qtdPorProduto = new Map<number, number>();
  for (const item of dados.itens) {
    qtdPorProduto.set(item.produto_id, (qtdPorProduto.get(item.produto_id) ?? 0) + item.quantidade);
  }

  let subtotal = 0;
  const itensComSubtotal = dados.itens.map(item => {
    const sub = item.quantidade * item.preco_unitario;
    subtotal += sub;
    return { ...item, subtotal: sub };
  });

  const executar = db.transaction(() => {
    for (const [produtoId, qtdTotal] of qtdPorProduto) {
      const produto = buscarProdutoPorId(produtoId);
      if (produto.estoque_atual < qtdTotal) {
        throw new AppError(`Estoque insuficiente para "${produto.nome}". Disponível: ${produto.estoque_atual}, pedido: ${qtdTotal}`, 422);
      }
    }

    const total = subtotal - (dados.desconto ?? 0);
    const pedidoInserido = db.prepare(`
      INSERT INTO pedidos (cliente_id, subtotal, desconto, total, observacoes)
      VALUES (?, ?, ?, ?, ?)
    `).run(dados.cliente_id ?? null, subtotal, dados.desconto ?? 0, total, dados.observacoes ?? null);

    const pedidoId = (pedidoInserido as any).lastInsertRowid as number;

    for (const item of itensComSubtotal) {
      db.prepare(`
        INSERT INTO itens_pedido (pedido_id, produto_id, quantidade, preco_unitario, subtotal)
        VALUES (?, ?, ?, ?, ?)
      `).run(pedidoId, item.produto_id, item.quantidade, item.preco_unitario, item.subtotal);

      db.prepare(`UPDATE produtos SET estoque_atual=estoque_atual-?, atualizado_em=datetime('now','localtime') WHERE id=?`).run(item.quantidade, item.produto_id);

      db.prepare(`
        INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo, referencia_id)
        VALUES (?, 'saida', ?, 'Venda Pedido #' || ?, ?)
      `).run(item.produto_id, item.quantidade, pedidoId, pedidoId);
    }

    if (dados.cliente_id) {
      db.prepare(`UPDATE clientes SET total_pedidos=total_pedidos+1 WHERE id=?`).run(dados.cliente_id);
    }

    return pedidoId;
  });

  return buscarPedidoPorId(executar());
}

export function atualizarStatusPedido(id: number, novoStatus: Pedido['status']): Pedido {
  const pedido = buscarPedidoPorId(id);

  const transicoesPermitidas: Record<string, string[]> = {
    aberto:     ['confirmado', 'cancelado'],
    confirmado: ['em_preparo', 'cancelado'],
    em_preparo: ['pronto',     'cancelado'],
    pronto:     ['entregue',   'cancelado'],
    entregue:   [],
    cancelado:  [],
  };

  if (!transicoesPermitidas[pedido.status].includes(novoStatus)) {
    throw new AppError(`Não é possível mover de "${pedido.status}" para "${novoStatus}"`, 422);
  }

  db.prepare(`UPDATE pedidos SET status=?, atualizado_em=datetime('now','localtime') WHERE id=?`).run(novoStatus, id);

  if (novoStatus === 'entregue') {
    db.prepare(`
      INSERT INTO lancamentos_financeiros (tipo, categoria, descricao, valor, referencia_id)
      VALUES ('receita', 'Vendas', 'Pedido #' || ?, ?, ?)
    `).run(id, pedido.total, id);
  }

  if (novoStatus === 'cancelado') {
    for (const item of pedido.itens) {
      db.prepare(`UPDATE produtos SET estoque_atual=estoque_atual+?, atualizado_em=datetime('now','localtime') WHERE id=?`).run(item.quantidade, item.produto_id);
      db.prepare(`
        INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, motivo, referencia_id)
        VALUES (?, 'entrada', ?, 'Cancelamento Pedido #' || ?, ?)
      `).run(item.produto_id, item.quantidade, id, id);
    }
    if (pedido.cliente_id) {
      db.prepare(`UPDATE clientes SET total_pedidos=MAX(0, total_pedidos-1) WHERE id=?`).run(pedido.cliente_id);
    }
  }

  return buscarPedidoPorId(id);
}

export function resumoVendas(dataInicio: string, dataFim: string) {
  return db.prepare(`
    SELECT
      COUNT(*) as total_pedidos,
      SUM(CASE WHEN status='entregue'  THEN 1     ELSE 0 END) as entregues,
      SUM(CASE WHEN status='cancelado' THEN 1     ELSE 0 END) as cancelados,
      SUM(CASE WHEN status='entregue'  THEN total ELSE 0 END) as receita_total
    FROM pedidos
    WHERE date(criado_em) BETWEEN ? AND ?
  `).get(dataInicio, dataFim);
}
