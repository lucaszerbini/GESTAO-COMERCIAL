import { db } from '../models/database';
import { AppError } from '../middlewares/validar';
import { LancamentoFinanceiro, ResumoFinanceiro } from '../types';
import { CriarLancamentoDTO } from '../models/schemas';

export function listarLancamentos(params: {
  data_inicio?: string;
  data_fim?: string;
  tipo?: 'receita' | 'despesa';
  categoria?: string;
  page: number;
  pageSize: number;
}) {
  const condicoes: string[] = [];
  const args: unknown[] = [];

  if (params.data_inicio) { condicoes.push('data_lancamento>=?');        args.push(params.data_inicio); }
  if (params.data_fim)    { condicoes.push('data_lancamento<=?');        args.push(params.data_fim); }
  if (params.tipo)        { condicoes.push('tipo=?');                    args.push(params.tipo); }
  if (params.categoria)   { condicoes.push('categoria LIKE ?');          args.push(`%${params.categoria}%`); }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.pageSize;

  const total = (db.prepare(`SELECT COUNT(*) as n FROM lancamentos_financeiros ${where}`).get(...args) as { n: number }).n;
  const lancamentos = db.prepare(`SELECT * FROM lancamentos_financeiros ${where} ORDER BY data_lancamento DESC LIMIT ? OFFSET ?`).all(...args, params.pageSize, offset) as LancamentoFinanceiro[];

  return { lancamentos, total };
}

export function buscarLancamentoPorId(id: number): LancamentoFinanceiro {
  const row = db.prepare('SELECT * FROM lancamentos_financeiros WHERE id=?').get(id) as LancamentoFinanceiro | undefined;
  if (!row) throw new AppError(`Lançamento #${id} não encontrado`, 404);
  return row;
}

export function criarLancamento(dados: CriarLancamentoDTO): LancamentoFinanceiro {
  const dataLancamento = dados.data_lancamento ?? new Date().toISOString().split('T')[0];
  const resultado = db.prepare(`
    INSERT INTO lancamentos_financeiros (tipo, categoria, descricao, valor, data_lancamento)
    VALUES (?, ?, ?, ?, ?)
  `).run(dados.tipo, dados.categoria, dados.descricao, dados.valor, dataLancamento);
  return buscarLancamentoPorId((resultado as any).lastInsertRowid as number);
}

export function removerLancamento(id: number): void {
  const lancamento = buscarLancamentoPorId(id);
  if (lancamento.referencia_id) {
    throw new AppError('Lançamento de venda não pode ser removido manualmente.', 409);
  }
  db.prepare('DELETE FROM lancamentos_financeiros WHERE id=?').run(id);
}

export function resumoFluxoCaixa(dataInicio: string, dataFim: string): ResumoFinanceiro {
  const totais = db.prepare(`
    SELECT
      SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END) as total_receitas,
      SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END) as total_despesas
    FROM lancamentos_financeiros
    WHERE data_lancamento BETWEEN ? AND ?
  `).get(dataInicio, dataFim) as any;

  const lancamentos = db.prepare(`
    SELECT * FROM lancamentos_financeiros
    WHERE data_lancamento BETWEEN ? AND ?
    ORDER BY data_lancamento ASC
  `).all(dataInicio, dataFim) as LancamentoFinanceiro[];

  const receitas = totais.total_receitas ?? 0;
  const despesas = totais.total_despesas ?? 0;

  return {
    periodo: `${dataInicio} a ${dataFim}`,
    total_receitas: receitas,
    total_despesas: despesas,
    saldo: receitas - despesas,
    lancamentos,
  };
}

export function fluxoCaixaDiario(dataInicio: string, dataFim: string) {
  return db.prepare(`
    SELECT
      data_lancamento as data,
      SUM(CASE WHEN tipo='receita' THEN valor ELSE 0 END) as receitas,
      SUM(CASE WHEN tipo='despesa' THEN valor ELSE 0 END) as despesas
    FROM lancamentos_financeiros
    WHERE data_lancamento BETWEEN ? AND ?
    GROUP BY data_lancamento
    ORDER BY data_lancamento ASC
  `).all(dataInicio, dataFim);
}

export function resumoPorCategoria(dataInicio: string, dataFim: string) {
  return db.prepare(`
    SELECT tipo, categoria, SUM(valor) as total, COUNT(*) as qtd
    FROM lancamentos_financeiros
    WHERE data_lancamento BETWEEN ? AND ?
    GROUP BY tipo, categoria
    ORDER BY tipo, total DESC
  `).all(dataInicio, dataFim);
}
