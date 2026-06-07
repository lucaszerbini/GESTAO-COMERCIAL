// Testes de pedidos
import request from 'supertest';
import app from '../src/index';
import { cleanDb, clienteBase, produtoBase } from './helpers';

afterEach(cleanDb);

async function criarProduto(overrides = {}) {
  const res = await request(app).post('/api/produtos').send({ ...produtoBase, ...overrides });
  return res.body.data;
}

async function criarCliente() {
  const res = await request(app).post('/api/clientes').send(clienteBase);
  return res.body.data;
}

describe('POST /api/pedidos', () => {
  it('cria pedido e desconta estoque automaticamente', async () => {
    const produto = await criarProduto();
    const res = await request(app).post('/api/pedidos').send({
      itens: [{ produto_id: produto.id, quantidade: 3, preco_unitario: produto.preco_venda }],
    });
    expect(res.status).toBe(201);
    expect(res.body.data.itens).toHaveLength(1);
    expect(res.body.data.total).toBeCloseTo(3 * produto.preco_venda);

    const estoque = await request(app).get(`/api/produtos/${produto.id}`);
    expect(estoque.body.data.estoque_atual).toBe(47);
  });

  it('cria pedido com cliente vinculado e incrementa total_pedidos', async () => {
    const cliente = await criarCliente();
    const produto = await criarProduto();
    await request(app).post('/api/pedidos').send({
      cliente_id: cliente.id,
      itens: [{ produto_id: produto.id, quantidade: 1, preco_unitario: produto.preco_venda }],
    });
    const clienteAtualizado = await request(app).get(`/api/clientes/${cliente.id}`);
    expect(clienteAtualizado.body.data.total_pedidos).toBe(1);
  });

  it('aplica desconto corretamente no total', async () => {
    const produto = await criarProduto();
    const res = await request(app).post('/api/pedidos').send({
      itens: [{ produto_id: produto.id, quantidade: 2, preco_unitario: 10.0 }],
      desconto: 5.0,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.subtotal).toBeCloseTo(20.0);
    expect(res.body.data.total).toBeCloseTo(15.0);
  });

  it('rejeita pedido com estoque insuficiente', async () => {
    const produto = await criarProduto({ estoque_atual: 5 });
    const res = await request(app).post('/api/pedidos').send({
      itens: [{ produto_id: produto.id, quantidade: 10, preco_unitario: produto.preco_venda }],
    });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('rejeita pedido sem itens', async () => {
    const res = await request(app).post('/api/pedidos').send({ itens: [] });
    expect(res.status).toBe(400);
  });

  it('valida estoque agregado quando há dois itens do mesmo produto', async () => {
    const produto = await criarProduto({ estoque_atual: 5 });
    const res = await request(app).post('/api/pedidos').send({
      itens: [
        { produto_id: produto.id, quantidade: 3, preco_unitario: produto.preco_venda },
        { produto_id: produto.id, quantidade: 4, preco_unitario: produto.preco_venda },
      ],
    });
    expect(res.status).toBe(422);
  });
});

describe('GET /api/pedidos', () => {
  beforeEach(async () => {
    const produto = await criarProduto();
    await request(app).post('/api/pedidos').send({
      itens: [{ produto_id: produto.id, quantidade: 1, preco_unitario: produto.preco_venda }],
    });
  });

  it('lista pedidos com paginação', async () => {
    const res = await request(app).get('/api/pedidos');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.total).toBe(1);
  });

  it('filtra por status', async () => {
    const res = await request(app).get('/api/pedidos?status=aberto');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);

    const vazio = await request(app).get('/api/pedidos?status=entregue');
    expect(vazio.body.data).toHaveLength(0);
  });
});

describe('PATCH /api/pedidos/:id/status', () => {
  let pedidoId: number;

  beforeEach(async () => {
    const produto = await criarProduto();
    const res = await request(app).post('/api/pedidos').send({
      itens: [{ produto_id: produto.id, quantidade: 2, preco_unitario: produto.preco_venda }],
    });
    pedidoId = res.body.data.id;
  });

  it('avança status no fluxo válido: aberto → confirmado → em_preparo → pronto → entregue', async () => {
    for (const status of ['confirmado', 'em_preparo', 'pronto', 'entregue'] as const) {
      const res = await request(app).patch(`/api/pedidos/${pedidoId}/status`).send({ status });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(status);
    }
  });

  it('rejeita transição inválida: aberto → entregue', async () => {
    const res = await request(app).patch(`/api/pedidos/${pedidoId}/status`).send({ status: 'entregue' });
    expect(res.status).toBe(422);
  });

  it('cancelar pedido devolve estoque e decrementa total_pedidos do cliente', async () => {
    const cliente = await criarCliente();
    const produto = await criarProduto({ codigo_barras: '7890000000099' });
    const pedido = await request(app).post('/api/pedidos').send({
      cliente_id: cliente.id,
      itens: [{ produto_id: produto.id, quantidade: 5, preco_unitario: produto.preco_venda }],
    });
    const pid = pedido.body.data.id;
    const estoqueAntes = produto.estoque_atual - 5;

    await request(app).patch(`/api/pedidos/${pid}/status`).send({ status: 'cancelado' });

    const produtoAtualizado = await request(app).get(`/api/produtos/${produto.id}`);
    expect(produtoAtualizado.body.data.estoque_atual).toBe(estoqueAntes + 5);

    const clienteAtualizado = await request(app).get(`/api/clientes/${cliente.id}`);
    expect(clienteAtualizado.body.data.total_pedidos).toBe(0);
  });

  it('entregar pedido cria lançamento financeiro de receita', async () => {
    for (const status of ['confirmado', 'em_preparo', 'pronto', 'entregue'] as const) {
      await request(app).patch(`/api/pedidos/${pedidoId}/status`).send({ status });
    }
    const pedido = await request(app).get(`/api/pedidos/${pedidoId}`);
    const total = pedido.body.data.total;
    const fin = await request(app).get('/api/financeiro?tipo=receita');
    expect(fin.body.data.some((l: any) => l.valor === total)).toBe(true);
  });
});

describe('GET /api/pedidos/resumo', () => {
  it('retorna totais do período', async () => {
    const res = await request(app).get('/api/pedidos/resumo');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('total_pedidos');
    expect(res.body.data).toHaveProperty('receita_total');
  });
});
