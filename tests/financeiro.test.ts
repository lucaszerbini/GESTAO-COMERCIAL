// Testes financeiro
import request from 'supertest';
import app from '../src/index';
import { cleanDb } from './helpers';

afterEach(cleanDb);

const lancamentoReceita = {
  tipo: 'receita' as const,
  categoria: 'Vendas',
  descricao: 'Venda balcão',
  valor: 200.00,
  data_lancamento: '2026-06-03',
};

const lancamentoDespesa = {
  tipo: 'despesa' as const,
  categoria: 'Fornecedores',
  descricao: 'Compra de mercadoria',
  valor: 80.00,
  data_lancamento: '2026-06-03',
};

describe('POST /api/financeiro', () => {
  it('cria lançamento de receita', async () => {
    const res = await request(app).post('/api/financeiro').send(lancamentoReceita);
    expect(res.status).toBe(201);
    expect(res.body.data.tipo).toBe('receita');
    expect(res.body.data.valor).toBe(200);
    expect(res.body.data.id).toBeDefined();
  });

  it('cria lançamento de despesa', async () => {
    const res = await request(app).post('/api/financeiro').send(lancamentoDespesa);
    expect(res.status).toBe(201);
    expect(res.body.data.tipo).toBe('despesa');
  });

  it('rejeita lançamento sem tipo', async () => {
    const { tipo, ...semTipo } = lancamentoReceita;
    const res = await request(app).post('/api/financeiro').send(semTipo);
    expect(res.status).toBe(400);
  });

  it('rejeita valor zero', async () => {
    const res = await request(app).post('/api/financeiro').send({ ...lancamentoReceita, valor: 0 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/financeiro', () => {
  beforeEach(async () => {
    await request(app).post('/api/financeiro').send(lancamentoReceita);
    await request(app).post('/api/financeiro').send(lancamentoDespesa);
  });

  it('lista lançamentos com paginação', async () => {
    const res = await request(app).get('/api/financeiro');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('filtra por tipo receita', async () => {
    const res = await request(app).get('/api/financeiro?tipo=receita');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].tipo).toBe('receita');
  });

  it('filtra por tipo despesa', async () => {
    const res = await request(app).get('/api/financeiro?tipo=despesa');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].tipo).toBe('despesa');
  });
});

describe('GET /api/financeiro/fluxo-caixa', () => {
  it('calcula saldo corretamente (receitas - despesas)', async () => {
    await request(app).post('/api/financeiro').send(lancamentoReceita); // +200
    await request(app).post('/api/financeiro').send(lancamentoDespesa); // -80

    const res = await request(app).get('/api/financeiro/fluxo-caixa?data_inicio=2026-06-01&data_fim=2026-06-30');
    expect(res.status).toBe(200);
    expect(res.body.data.total_receitas).toBeCloseTo(200);
    expect(res.body.data.total_despesas).toBeCloseTo(80);
    expect(res.body.data.saldo).toBeCloseTo(120);
  });
});

describe('GET /api/financeiro/diario', () => {
  it('agrupa por data', async () => {
    await request(app).post('/api/financeiro').send(lancamentoReceita);
    const res = await request(app).get('/api/financeiro/diario?data_inicio=2026-06-01&data_fim=2026-06-30');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('data');
    expect(res.body.data[0]).toHaveProperty('receitas');
    expect(res.body.data[0]).toHaveProperty('despesas');
  });
});

describe('GET /api/financeiro/categorias', () => {
  it('agrupa por tipo e categoria', async () => {
    await request(app).post('/api/financeiro').send(lancamentoReceita);
    await request(app).post('/api/financeiro').send(lancamentoDespesa);
    const res = await request(app).get('/api/financeiro/categorias?data_inicio=2026-06-01&data_fim=2026-06-30');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    const tipos = res.body.data.map((r: any) => r.tipo);
    expect(tipos).toContain('receita');
    expect(tipos).toContain('despesa');
  });
});

describe('DELETE /api/financeiro/:id', () => {
  it('remove lançamento manual', async () => {
    const criado = await request(app).post('/api/financeiro').send(lancamentoReceita);
    const id = criado.body.data.id;
    const del = await request(app).delete(`/api/financeiro/${id}`);
    expect(del.status).toBe(200);
    const lista = await request(app).get('/api/financeiro');
    expect(lista.body.data).toHaveLength(0);
  });

  it('não permite remover lançamento de venda (referencia_id preenchido)', async () => {
    // Simula lançamento de venda inserindo diretamente via serviço (ou via pedido entregue)
    // Para simplicidade, inserimos manualmente com referencia_id via SQL
    const { db } = await import('../src/models/database');
    db.prepare(`INSERT INTO lancamentos_financeiros (tipo,categoria,descricao,valor,referencia_id) VALUES ('receita','Vendas','Pedido #1',100,1)`).run();

    const lista = await request(app).get('/api/financeiro');
    const lancamento = lista.body.data.find((l: any) => l.referencia_id === 1);
    expect(lancamento).toBeDefined();

    const del = await request(app).delete(`/api/financeiro/${lancamento.id}`);
    expect(del.status).toBe(409);
  });

  it('retorna 404 para lançamento inexistente', async () => {
    const res = await request(app).delete('/api/financeiro/99999');
    expect(res.status).toBe(404);
  });
});
