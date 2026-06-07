import { db } from '../models/database';
import { AppError } from '../middlewares/validar';
import { Cliente } from '../types';
import { CriarClienteDTO } from '../models/schemas';

function toCliente(row: Record<string, unknown>): Cliente {
  return {
    ...(row as unknown as Cliente),
    endereco: {
      logradouro:  row.logradouro  as string,
      numero:      row.numero      as string,
      complemento: row.complemento as string | undefined,
      bairro:      row.bairro      as string,
      cidade:      row.cidade      as string,
      estado:      row.estado      as string,
      cep:         row.cep         as string,
    },
  };
}

export function listarClientes(params: { busca?: string; page: number; pageSize: number }) {
  const offset = (params.page - 1) * params.pageSize;
  const condicoes: string[] = ['ativo=1'];
  const args: unknown[] = [];

  if (params.busca) {
    const termo = `%${params.busca}%`;
    condicoes.push('(nome LIKE ? OR telefone LIKE ?)');
    args.push(termo, termo);
  }

  const where = `WHERE ${condicoes.join(' AND ')}`;
  const total = (db.prepare(`SELECT COUNT(*) as n FROM clientes ${where}`).get(...args) as { n: number }).n;
  const rows = db.prepare(`SELECT * FROM clientes ${where} ORDER BY nome LIMIT ? OFFSET ?`).all(...args, params.pageSize, offset) as Record<string, unknown>[];

  return { clientes: rows.map(toCliente), total };
}

export function buscarClientePorId(id: number): Cliente {
  const row = db.prepare('SELECT * FROM clientes WHERE id=? AND ativo=1').get(id) as Record<string, unknown> | undefined;
  if (!row) throw new AppError(`Cliente #${id} não encontrado`, 404);
  return toCliente(row);
}

export function criarCliente(dados: CriarClienteDTO): Cliente {
  const { nome, telefone, email, cpf_cnpj, endereco } = dados;
  const resultado = db.prepare(`
    INSERT INTO clientes (nome, telefone, email, cpf_cnpj, logradouro, numero, complemento, bairro, cidade, estado, cep)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    nome, telefone,
    email ?? null, cpf_cnpj ?? null,
    endereco.logradouro, endereco.numero, endereco.complemento ?? null,
    endereco.bairro, endereco.cidade, endereco.estado, endereco.cep,
  );
  return buscarClientePorId((resultado as any).lastInsertRowid as number);
}

export function atualizarCliente(id: number, dados: Partial<CriarClienteDTO>): Cliente {
  buscarClientePorId(id);

  const campos: string[] = [];
  const valores: unknown[] = [];

  const camposSimples: Record<string, unknown> = {
    nome: dados.nome,
    telefone: dados.telefone,
    email: dados.email,
    cpf_cnpj: dados.cpf_cnpj,
  };

  for (const [campo, valor] of Object.entries(camposSimples)) {
    if (valor !== undefined) {
      campos.push(`${campo}=?`);
      valores.push(valor);
    }
  }

  if (dados.endereco) {
    const camposEndereco = ['logradouro', 'numero', 'complemento', 'bairro', 'cidade', 'estado', 'cep'];
    for (const campo of camposEndereco) {
      const valor = (dados.endereco as any)[campo];
      if (valor !== undefined) {
        campos.push(`${campo}=?`);
        valores.push(valor);
      }
    }
  }

  if (!campos.length) throw new AppError('Nenhum campo para atualizar');

  campos.push(`atualizado_em=datetime('now','localtime')`);
  valores.push(id);

  db.prepare(`UPDATE clientes SET ${campos.join(', ')} WHERE id=?`).run(...valores);
  return buscarClientePorId(id);
}

export function removerCliente(id: number): void {
  buscarClientePorId(id);
  db.prepare(`UPDATE clientes SET ativo=0, atualizado_em=datetime('now','localtime') WHERE id=?`).run(id);
}

export function historicoCliente(id: number) {
  const cliente = buscarClientePorId(id);
  const pedidos = db.prepare(`SELECT p.* FROM pedidos p WHERE p.cliente_id=? ORDER BY p.criado_em DESC`).all(id);
  const totalGasto = pedidos
    .filter((p: unknown) => (p as any).status === 'entregue')
    .reduce((acumulado: number, p: unknown) => acumulado + (p as any).total, 0);
  return { cliente, total_gasto: totalGasto, pedidos };
}
