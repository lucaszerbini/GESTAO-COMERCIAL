// Testes de funcionarios
import request from 'supertest';
import app from '../src/index';
import { cleanDb, funcionarioBase } from './helpers';

afterEach(cleanDb);

describe('POST /api/funcionarios', () => {
  it('cadastra funcionário com dados válidos', async () => {
    const res = await request(app).post('/api/funcionarios').send(funcionarioBase);
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeDefined();
    expect(res.body.data.nome).toBe(funcionarioBase.nome);
    expect(res.body.data.ativo).toBe(true);
  });

  it('rejeita CPF duplicado', async () => {
    await request(app).post('/api/funcionarios').send(funcionarioBase);
    const res = await request(app).post('/api/funcionarios').send({ ...funcionarioBase, nome: 'Outro Nome' });
    expect(res.status).toBe(409);
  });

  it('rejeita CPF com formato inválido', async () => {
    const res = await request(app).post('/api/funcionarios').send({ ...funcionarioBase, cpf: '123' });
    expect(res.status).toBe(400);
  });

  it('rejeita salário_base zero ou negativo', async () => {
    const res = await request(app).post('/api/funcionarios').send({ ...funcionarioBase, salario_base: 0 });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/funcionarios', () => {
  beforeEach(async () => {
    await request(app).post('/api/funcionarios').send(funcionarioBase);
    await request(app).post('/api/funcionarios').send({ ...funcionarioBase, cpf: '987.654.321-00', nome: 'Pedro Souza' });
  });

  it('lista funcionários ativos', async () => {
    const res = await request(app).get('/api/funcionarios');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('filtra por busca', async () => {
    const res = await request(app).get('/api/funcionarios?busca=Pedro');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].nome).toBe('Pedro Souza');
  });
});

describe('PATCH /api/funcionarios/:id', () => {
  it('atualiza cargo e salário', async () => {
    const criado = await request(app).post('/api/funcionarios').send(funcionarioBase);
    const id = criado.body.data.id;
    const res = await request(app).patch(`/api/funcionarios/${id}`).send({ cargo: 'Gerente', salario_base: 4000 });
    expect(res.status).toBe(200);
    expect(res.body.data.cargo).toBe('Gerente');
    expect(res.body.data.salario_base).toBe(4000);
  });
});

describe('POST /api/funcionarios/:id/demitir', () => {
  it('demite funcionário com data válida', async () => {
    const criado = await request(app).post('/api/funcionarios').send(funcionarioBase);
    const id = criado.body.data.id;
    const res = await request(app).post(`/api/funcionarios/${id}/demitir`).send({ data_demissao: '2026-06-03' });
    expect(res.status).toBe(200);
    expect(res.body.data.ativo).toBe(false);
    expect(res.body.data.data_demissao).toBe('2026-06-03');
  });

  it('rejeita demissão sem data_demissao', async () => {
    const criado = await request(app).post('/api/funcionarios').send(funcionarioBase);
    const id = criado.body.data.id;
    const res = await request(app).post(`/api/funcionarios/${id}/demitir`).send({});
    expect(res.status).toBe(400);
  });

  it('rejeita data no formato inválido', async () => {
    const criado = await request(app).post('/api/funcionarios').send(funcionarioBase);
    const id = criado.body.data.id;
    const res = await request(app).post(`/api/funcionarios/${id}/demitir`).send({ data_demissao: '03/06/2026' });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/funcionarios/calcular-salario', () => {
  let funcionarioId: number;

  beforeEach(async () => {
    const res = await request(app).post('/api/funcionarios').send(funcionarioBase);
    funcionarioId = res.body.data.id;
  });

  it('retorna estrutura completa com INSS e IRRF', async () => {
    const res = await request(app).post('/api/funcionarios/calcular-salario').send({
      funcionario_id: funcionarioId,
      mes_referencia: '2026-06',
    });
    expect(res.status).toBe(200);
    expect(res.body.data.salario_base).toBe(2500);
    expect(res.body.data.inss).toBeDefined();
    expect(res.body.data.irrf).toBeDefined();
    expect(res.body.data.salario_liquido).toBeDefined();
    expect(res.body.data.inss.valor).toBeGreaterThan(0);
    expect(res.body.data.salario_liquido).toBeLessThan(2500);
  });

  it('salário de R$1.412 (1ª faixa INSS) tem alíquota efetiva de 7,5%', async () => {
    const fun1412 = await request(app).post('/api/funcionarios').send({
      ...funcionarioBase,
      cpf: '111.222.333-96',
      salario_base: 1412.0,
    });
    const res = await request(app).post('/api/funcionarios/calcular-salario').send({
      funcionario_id: fun1412.body.data.id,
      mes_referencia: '2026-06',
    });
    expect(res.status).toBe(200);
    const inssValor = res.body.data.inss.valor;
    expect(inssValor).toBeCloseTo(1412 * 0.075, 1);
  });

  it('inclui outros_beneficios no salário bruto', async () => {
    const res = await request(app).post('/api/funcionarios/calcular-salario').send({
      funcionario_id: funcionarioId,
      mes_referencia: '2026-06',
      outros_beneficios: 200,
      outros_descontos: 50,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.outros_beneficios).toBe(200);
    expect(res.body.data.outros_descontos).toBe(50);
  });

  it('rejeita mes_referencia com formato inválido', async () => {
    const res = await request(app).post('/api/funcionarios/calcular-salario').send({
      funcionario_id: funcionarioId,
      mes_referencia: '06/2026',
    });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/funcionarios/calcular-ferias', () => {
  let funcionarioId: number;

  beforeEach(async () => {
    const res = await request(app).post('/api/funcionarios').send(funcionarioBase);
    funcionarioId = res.body.data.id;
  });

  it('calcula férias completas (30 dias) com 1/3 constitucional', async () => {
    const res = await request(app).post('/api/funcionarios/calcular-ferias').send({
      funcionario_id: funcionarioId,
      dias_ferias: 30,
    });
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.dias_ferias).toBe(30);
    expect(d.valor_ferias).toBeCloseTo(2500, 0);
    expect(d.total_bruto).toBeCloseTo(2500 + 2500 / 3, 0);
    expect(d.total_liquido).toBeLessThan(d.total_bruto);
  });

  it('calcula férias com abono pecuniário (venda de 10 dias)', async () => {
    const res = await request(app).post('/api/funcionarios/calcular-ferias').send({
      funcionario_id: funcionarioId,
      abono_pecuniario: true,
    });
    expect(res.status).toBe(200);
    const d = res.body.data;
    expect(d.dias_ferias).toBe(20);
    expect(d.abono_pecuniario).toBeGreaterThan(0);
    expect(d.periodo_aquisitivo.inicio).toBeDefined();
    expect(d.periodo_aquisitivo.fim).toBeDefined();
  });

  it('rejeita funcionário inexistente', async () => {
    const res = await request(app).post('/api/funcionarios/calcular-ferias').send({ funcionario_id: 99999 });
    expect(res.status).toBe(404);
  });
});
