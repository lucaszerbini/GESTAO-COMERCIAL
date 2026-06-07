// Testes de clientes
import request from 'supertest';
import app from '../src/index';
import { cleanDb, clienteBase } from './helpers';

afterEach(cleanDb);

describe('POST /api/clientes', () => {
  it('cria cliente com dados válidos', async () => {
    const res = await request(app).post('/api/clientes').send(clienteBase);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.nome).toBe(clienteBase.nome);
    expect(res.body.data.endereco.cidade).toBe('São Paulo');
  });

  it('rejeita cliente sem nome', async () => {
    const { nome, ...semNome } = clienteBase;
    const res = await request(app).post('/api/clientes').send(semNome);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('rejeita cliente com estado inválido (mais de 2 caracteres)', async () => {
    const res = await request(app).post('/api/clientes').send({
      ...clienteBase,
      endereco: { ...clienteBase.endereco, estado: 'SPP' },
    });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/clientes', () => {
  beforeEach(async () => {
    await request(app).post('/api/clientes').send(clienteBase);
    await request(app).post('/api/clientes').send({ ...clienteBase, nome: 'Ana Teste', telefone: '(11) 99999-0002' });
  });

  it('lista clientes com paginação', async () => {
    const res = await request(app).get('/api/clientes');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('filtra clientes por busca', async () => {
    const res = await request(app).get('/api/clientes?busca=Ana');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].nome).toBe('Ana Teste');
  });

  it('respeita pageSize', async () => {
    const res = await request(app).get('/api/clientes?page=1&pageSize=1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.totalPages).toBe(2);
  });
});

describe('GET /api/clientes/:id', () => {
  it('retorna cliente existente', async () => {
    const criado = await request(app).post('/api/clientes').send(clienteBase);
    const id = criado.body.data.id;
    const res = await request(app).get(`/api/clientes/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(id);
  });

  it('retorna 404 para cliente inexistente', async () => {
    const res = await request(app).get('/api/clientes/99999');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

describe('PATCH /api/clientes/:id', () => {
  it('atualiza nome e telefone', async () => {
    const criado = await request(app).post('/api/clientes').send(clienteBase);
    const id = criado.body.data.id;
    const res = await request(app).patch(`/api/clientes/${id}`).send({ nome: 'João Atualizado' });
    expect(res.status).toBe(200);
    expect(res.body.data.nome).toBe('João Atualizado');
  });
});

describe('DELETE /api/clientes/:id', () => {
  it('remove cliente (soft delete) e some da listagem', async () => {
    const criado = await request(app).post('/api/clientes').send(clienteBase);
    const id = criado.body.data.id;

    const del = await request(app).delete(`/api/clientes/${id}`);
    expect(del.status).toBe(200);

    const lista = await request(app).get('/api/clientes');
    expect(lista.body.data).toHaveLength(0);

    const busca = await request(app).get(`/api/clientes/${id}`);
    expect(busca.status).toBe(404);
  });
});

describe('GET /api/clientes/:id/historico', () => {
  it('retorna histórico do cliente', async () => {
    const criado = await request(app).post('/api/clientes').send(clienteBase);
    const id = criado.body.data.id;
    const res = await request(app).get(`/api/clientes/${id}/historico`);
    expect(res.status).toBe(200);
    expect(res.body.data.cliente.id).toBe(id);
    expect(res.body.data.pedidos).toBeInstanceOf(Array);
    expect(res.body.data.total_gasto).toBeDefined();
  });
});
