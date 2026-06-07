// Testes de produtos
import request from 'supertest';
import app from '../src/index';
import { cleanDb, produtoBase } from './helpers';

afterEach(cleanDb);

describe('POST /api/produtos', () => {
  it('cria produto com dados válidos', async () => {
    const res = await request(app).post('/api/produtos').send(produtoBase);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.codigo_barras).toBe(produtoBase.codigo_barras);
    expect(res.body.data.estoque_atual).toBe(50);
    expect(res.body.data.ativo).toBe(true);
  });

  it('rejeita produto sem codigo_barras', async () => {
    const { codigo_barras, ...semCodigo } = produtoBase;
    const res = await request(app).post('/api/produtos').send(semCodigo);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('rejeita código de barras duplicado', async () => {
    await request(app).post('/api/produtos').send(produtoBase);
    const res = await request(app).post('/api/produtos').send(produtoBase);
    expect(res.status).toBe(409);
  });

  it('registra movimentação de estoque no cadastro inicial', async () => {
    const criado = await request(app).post('/api/produtos').send(produtoBase);
    const id = criado.body.data.id;
    const hist = await request(app).get(`/api/produtos/${id}/estoque`);
    expect(hist.body.data).toHaveLength(1);
    expect(hist.body.data[0].tipo).toBe('entrada');
    expect(hist.body.data[0].motivo).toBe('Cadastro inicial');
  });
});

describe('GET /api/produtos', () => {
  beforeEach(async () => {
    await request(app).post('/api/produtos').send(produtoBase);
    await request(app).post('/api/produtos').send({ ...produtoBase, nome: 'Outro Produto', codigo_barras: '7890000000002' });
  });

  it('lista produtos com paginação', async () => {
    const res = await request(app).get('/api/produtos');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('filtra por categoria', async () => {
    const res = await request(app).get('/api/produtos?categoria=Teste');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('GET /api/produtos/codigo/:codigo', () => {
  it('busca produto pelo código de barras', async () => {
    await request(app).post('/api/produtos').send(produtoBase);
    const res = await request(app).get(`/api/produtos/codigo/${produtoBase.codigo_barras}`);
    expect(res.status).toBe(200);
    expect(res.body.data.codigo_barras).toBe(produtoBase.codigo_barras);
  });

  it('retorna 404 para código inexistente', async () => {
    const res = await request(app).get('/api/produtos/codigo/0000000000000');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/produtos/:id', () => {
  it('atualiza nome e preço', async () => {
    const criado = await request(app).post('/api/produtos').send(produtoBase);
    const id = criado.body.data.id;
    const res = await request(app).patch(`/api/produtos/${id}`).send({ nome: 'Produto Renomeado', preco_venda: 20.0 });
    expect(res.status).toBe(200);
    expect(res.body.data.nome).toBe('Produto Renomeado');
    expect(res.body.data.preco_venda).toBe(20.0);
  });
});

describe('DELETE /api/produtos/:id', () => {
  it('desativa produto (soft delete)', async () => {
    const criado = await request(app).post('/api/produtos').send(produtoBase);
    const id = criado.body.data.id;
    const del = await request(app).delete(`/api/produtos/${id}`);
    expect(del.status).toBe(200);
    const busca = await request(app).get(`/api/produtos/${id}`);
    expect(busca.status).toBe(404);
  });
});

describe('POST /api/produtos/:id/movimentar', () => {
  let produtoId: number;

  beforeEach(async () => {
    const res = await request(app).post('/api/produtos').send(produtoBase);
    produtoId = res.body.data.id;
  });

  it('registra entrada e aumenta estoque', async () => {
    const res = await request(app)
      .post(`/api/produtos/${produtoId}/movimentar`)
      .send({ tipo: 'entrada', quantidade: 20, motivo: 'Reposição' });
    expect(res.status).toBe(201);
    expect(res.body.data.produto.estoque_atual).toBe(70);
  });

  it('registra saída e diminui estoque', async () => {
    const res = await request(app)
      .post(`/api/produtos/${produtoId}/movimentar`)
      .send({ tipo: 'saida', quantidade: 10, motivo: 'Retirada' });
    expect(res.status).toBe(201);
    expect(res.body.data.produto.estoque_atual).toBe(40);
  });

  it('rejeita saída com estoque insuficiente', async () => {
    const res = await request(app)
      .post(`/api/produtos/${produtoId}/movimentar`)
      .send({ tipo: 'saida', quantidade: 999, motivo: 'Excesso' });
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });

  it('ajuste define valor absoluto de estoque', async () => {
    const res = await request(app)
      .post(`/api/produtos/${produtoId}/movimentar`)
      .send({ tipo: 'ajuste', quantidade: 30, motivo: 'Inventário' });
    expect(res.status).toBe(201);
    expect(res.body.data.produto.estoque_atual).toBe(30);
  });
});

describe('GET /api/produtos/estoque-baixo', () => {
  it('retorna apenas produtos abaixo do mínimo', async () => {
    await request(app).post('/api/produtos').send({ ...produtoBase, estoque_atual: 2, estoque_minimo: 10 });
    await request(app).post('/api/produtos').send({ ...produtoBase, nome: 'Produto OK', codigo_barras: '7890000000002', estoque_atual: 100, estoque_minimo: 10 });

    const res = await request(app).get('/api/produtos/estoque-baixo');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].nome).toBe(produtoBase.nome);
  });
});

describe('GET /api/produtos/:id/ean13', () => {
  it('gera código EAN-13 válido', async () => {
    const criado = await request(app).post('/api/produtos').send(produtoBase);
    const id = criado.body.data.id;
    const res = await request(app).get(`/api/produtos/${id}/ean13`);
    expect(res.status).toBe(200);
    expect(res.body.data.ean13).toMatch(/^\d{13}$/);
  });
});
