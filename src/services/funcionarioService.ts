import { db } from '../models/database';
import { AppError } from '../middlewares/validar';
import { Funcionario, CalculoSalario, CalculoFerias, InssCalculo, IrrfCalculo } from '../types';
import { CriarFuncionarioDTO, CalcularSalarioDTO, CalcularFeriasDTO } from '../models/schemas';

const TABELA_INSS = [
  { ate: 1412.00,  aliquota: 0.075 },
  { ate: 2666.68,  aliquota: 0.09  },
  { ate: 4000.03,  aliquota: 0.12  },
  { ate: 7786.02,  aliquota: 0.14  },
];

const TABELA_IRRF = [
  { ate: 2259.20,  aliquota: 0,     deducao: 0      },
  { ate: 2826.65,  aliquota: 0.075, deducao: 169.44 },
  { ate: 3751.05,  aliquota: 0.15,  deducao: 381.44 },
  { ate: 4664.68,  aliquota: 0.225, deducao: 662.77 },
  { ate: Infinity, aliquota: 0.275, deducao: 896.00 },
];

export function calcularInss(salario: number): InssCalculo {
  const teto = Math.min(salario, 7786.02);
  let contribuicao = 0;
  let limiteAnterior = 0;

  for (const faixa of TABELA_INSS) {
    const base = Math.min(teto, faixa.ate) - limiteAnterior;
    contribuicao += base * faixa.aliquota;
    limiteAnterior = faixa.ate;
    if (teto <= faixa.ate) break;
  }

  const aliquotaEfetiva = contribuicao / salario;
  return {
    base_calculo: salario,
    aliquota: aliquotaEfetiva,
    valor: Math.round(contribuicao * 100) / 100,
    descricao: `INSS ${(aliquotaEfetiva * 100).toFixed(2)}% efetivo`,
  };
}

export function calcularIrrf(base: number, dependentes = 0): IrrfCalculo {
  const deducaoDependentes = dependentes * 189.59;
  const baseCalculo = base - deducaoDependentes;
  const faixa = TABELA_IRRF.find(f => baseCalculo <= f.ate)!;
  const indice = TABELA_IRRF.indexOf(faixa);
  const nomesFaixas = ['Isento', '7,5%', '15%', '22,5%', '27,5%'];

  const imposto = Math.max(0, baseCalculo * faixa.aliquota - faixa.deducao);
  return {
    base_calculo: baseCalculo,
    aliquota: faixa.aliquota,
    deducao: faixa.deducao,
    valor: Math.round(imposto * 100) / 100,
    faixa: nomesFaixas[indice],
  };
}

function toFuncionario(row: unknown): Funcionario {
  const r = row as any;
  return { ...r, ativo: r.ativo === 1 } as Funcionario;
}

export function listarFuncionarios(params: { busca?: string; ativo?: boolean; page: number; pageSize: number }) {
  const condicoes: string[] = [];
  const args: unknown[] = [];

  if (params.busca) {
    const termo = `%${params.busca}%`;
    condicoes.push('(nome LIKE ? OR cargo LIKE ?)');
    args.push(termo, termo);
  }
  if (params.ativo !== undefined) {
    condicoes.push('ativo=?');
    args.push(params.ativo ? 1 : 0);
  }

  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
  const offset = (params.page - 1) * params.pageSize;

  const total = (db.prepare(`SELECT COUNT(*) as n FROM funcionarios ${where}`).get(...args) as { n: number }).n;
  const funcionarios = db.prepare(`SELECT * FROM funcionarios ${where} ORDER BY nome LIMIT ? OFFSET ?`).all(...args, params.pageSize, offset).map(toFuncionario);

  return { funcionarios, total };
}

export function buscarFuncionarioPorId(id: number): Funcionario {
  const row = db.prepare('SELECT * FROM funcionarios WHERE id=?').get(id);
  if (!row) throw new AppError(`Funcionário #${id} não encontrado`, 404);
  return toFuncionario(row);
}

export function criarFuncionario(dados: CriarFuncionarioDTO): Funcionario {
  if (db.prepare('SELECT id FROM funcionarios WHERE cpf=?').get(dados.cpf)) {
    throw new AppError('CPF já cadastrado', 409);
  }
  const resultado = db.prepare(`
    INSERT INTO funcionarios (nome, cpf, cargo, salario_base, data_admissao)
    VALUES (?, ?, ?, ?, ?)
  `).run(dados.nome, dados.cpf, dados.cargo, dados.salario_base, dados.data_admissao);
  return buscarFuncionarioPorId((resultado as any).lastInsertRowid as number);
}

export function atualizarFuncionario(id: number, dados: Partial<CriarFuncionarioDTO>): Funcionario {
  buscarFuncionarioPorId(id);

  const campos: string[] = [];
  const valores: unknown[] = [];

  const mapa: Record<string, unknown> = {
    nome: dados.nome,
    cargo: dados.cargo,
    salario_base: dados.salario_base,
    data_admissao: dados.data_admissao,
  };

  for (const [campo, valor] of Object.entries(mapa)) {
    if (valor !== undefined) {
      campos.push(`${campo}=?`);
      valores.push(valor);
    }
  }

  if (!campos.length) throw new AppError('Nenhum campo para atualizar');

  valores.push(id);
  db.prepare(`UPDATE funcionarios SET ${campos.join(', ')} WHERE id=?`).run(...valores);
  return buscarFuncionarioPorId(id);
}

export function demitirFuncionario(id: number, data: string): Funcionario {
  buscarFuncionarioPorId(id);
  db.prepare(`UPDATE funcionarios SET ativo=0, data_demissao=? WHERE id=?`).run(data, id);
  return buscarFuncionarioPorId(id);
}

export function calcularSalario(dados: CalcularSalarioDTO): CalculoSalario {
  const funcionario = buscarFuncionarioPorId(dados.funcionario_id);
  const salarioBruto = funcionario.salario_base + dados.outros_beneficios;
  const inss = calcularInss(salarioBruto);
  const irrf = calcularIrrf(salarioBruto - inss.valor);
  const salarioLiquido = Math.round((salarioBruto - inss.valor - irrf.valor - dados.outros_descontos) * 100) / 100;

  return {
    funcionario_id: funcionario.id,
    nome: funcionario.nome,
    mes_referencia: dados.mes_referencia,
    salario_base: funcionario.salario_base,
    inss,
    irrf,
    outros_descontos: dados.outros_descontos,
    outros_beneficios: dados.outros_beneficios,
    salario_liquido: salarioLiquido,
  };
}

export function calcularFerias(dados: CalcularFeriasDTO): CalculoFerias {
  const funcionario = buscarFuncionarioPorId(dados.funcionario_id);

  const dataAdmissao = new Date(funcionario.data_admissao);
  const fimPeriodo = new Date(dataAdmissao);
  fimPeriodo.setFullYear(fimPeriodo.getFullYear() + 1);
  fimPeriodo.setDate(fimPeriodo.getDate() - 1);

  const diasFerias = dados.abono_pecuniario ? 20 : dados.dias_ferias;
  const valorDiario = funcionario.salario_base / 30;
  const valorFerias = valorDiario * diasFerias;
  const adicionalTerco = valorFerias / 3;
  const abonoPecuniario = dados.abono_pecuniario ? (valorDiario * 10) + (valorDiario * 10) / 3 : 0;
  const totalBruto = valorFerias + adicionalTerco + abonoPecuniario;

  const inss = calcularInss(valorFerias + adicionalTerco);
  const irrf = calcularIrrf(valorFerias + adicionalTerco - inss.valor);

  return {
    funcionario_id: funcionario.id,
    nome: funcionario.nome,
    periodo_aquisitivo: {
      inicio: dataAdmissao.toISOString().split('T')[0],
      fim: fimPeriodo.toISOString().split('T')[0],
    },
    dias_ferias: diasFerias,
    salario_base: funcionario.salario_base,
    valor_ferias: Math.round(valorFerias * 100) / 100,
    abono_pecuniario: Math.round(abonoPecuniario * 100) / 100,
    total_bruto: Math.round(totalBruto * 100) / 100,
    inss: inss.valor,
    irrf: irrf.valor,
    total_liquido: Math.round((totalBruto - inss.valor - irrf.valor) * 100) / 100,
  };
}
