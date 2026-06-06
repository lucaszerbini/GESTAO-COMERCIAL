// Modulo de configuracao e conexao com o banco de dados
import fs from 'fs';
import path from 'path';

const DB_PATH = process.env.DB_PATH ?? './data/gestao.db';
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

class DbWrapper {
  private db: any;

  constructor() {
    try {
      const { DatabaseSync } = require('node:sqlite');
      this.db = new DatabaseSync(DB_PATH);
      this.db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
      console.log('✅ SQLite nativo Node.js ativo');
    } catch {
      try {
        const Database = require('better-sqlite3');
        this.db = new Database(DB_PATH);
        this.db.pragma('journal_mode = WAL');
        this.db.pragma('foreign_keys = ON');
        console.log('✅ better-sqlite3 ativo');
      } catch {
        throw new Error('Nenhum driver SQLite disponível. Rode: npm install better-sqlite3');
      }
    }
  }

  exec(sql: string) {
    return this.db.exec(sql);
  }

  pragma(sql: string) {
    return this.db.pragma?.(sql);
  }

  close() {
    return this.db.close?.();
  }

  prepare(sql: string) {
    const stmt = this.db.prepare(sql);
    return {
      run: (...args: any[]) => stmt.run(...args),
      get: (...args: any[]) => stmt.get(...args),
      all: (...args: any[]) => stmt.all(...args),
    };
  }

  transaction(fn: () => any) {
    return this.db.transaction ? this.db.transaction(fn) : () => fn();
  }
}

export const db = new DbWrapper();

export function inicializarBancoDeDados(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS clientes (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      nome         TEXT    NOT NULL,
      telefone     TEXT    NOT NULL,
      email        TEXT,
      cpf_cnpj     TEXT,
      logradouro   TEXT    NOT NULL DEFAULT '',
      numero       TEXT    NOT NULL DEFAULT '',
      complemento  TEXT,
      bairro       TEXT    NOT NULL DEFAULT '',
      cidade       TEXT    NOT NULL DEFAULT '',
      estado       TEXT    NOT NULL DEFAULT '',
      cep          TEXT    NOT NULL DEFAULT '',
      total_pedidos INTEGER NOT NULL DEFAULT 0,
      ativo        INTEGER NOT NULL DEFAULT 1,
      criado_em    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      atualizado_em TEXT   NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS produtos (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nome          TEXT    NOT NULL,
      descricao     TEXT,
      codigo_barras TEXT    NOT NULL UNIQUE,
      preco_custo   REAL    NOT NULL DEFAULT 0,
      preco_venda   REAL    NOT NULL,
      estoque_atual REAL    NOT NULL DEFAULT 0,
      estoque_minimo REAL   NOT NULL DEFAULT 0,
      unidade       TEXT    NOT NULL DEFAULT 'un',
      categoria     TEXT,
      ativo         INTEGER NOT NULL DEFAULT 1,
      criado_em     TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      atualizado_em TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      produto_id   INTEGER NOT NULL REFERENCES produtos(id),
      tipo         TEXT    NOT NULL CHECK (tipo IN ('entrada','saida','ajuste')),
      quantidade   REAL    NOT NULL,
      motivo       TEXT    NOT NULL,
      referencia_id INTEGER,
      criado_em    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS pedidos (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id   INTEGER REFERENCES clientes(id),
      status       TEXT    NOT NULL DEFAULT 'aberto',
      subtotal     REAL    NOT NULL DEFAULT 0,
      desconto     REAL    NOT NULL DEFAULT 0,
      total        REAL    NOT NULL DEFAULT 0,
      observacoes  TEXT,
      criado_em    TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      atualizado_em TEXT   NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS itens_pedido (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      pedido_id      INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
      produto_id     INTEGER NOT NULL REFERENCES produtos(id),
      quantidade     REAL    NOT NULL,
      preco_unitario REAL    NOT NULL,
      subtotal       REAL    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lancamentos_financeiros (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      tipo             TEXT NOT NULL CHECK (tipo IN ('receita','despesa')),
      categoria        TEXT NOT NULL,
      descricao        TEXT NOT NULL,
      valor            REAL NOT NULL,
      data_lancamento  TEXT NOT NULL DEFAULT (date('now','localtime')),
      referencia_id    INTEGER,
      criado_em        TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS funcionarios (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      nome          TEXT    NOT NULL,
      cpf           TEXT    NOT NULL UNIQUE,
      cargo         TEXT    NOT NULL,
      salario_base  REAL    NOT NULL,
      data_admissao TEXT    NOT NULL,
      data_demissao TEXT,
      ativo         INTEGER NOT NULL DEFAULT 1,
      criado_em     TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_produtos_codigo   ON produtos(codigo_barras);
    CREATE INDEX IF NOT EXISTS idx_pedidos_status    ON pedidos(status);
    CREATE INDEX IF NOT EXISTS idx_lancamentos_data  ON lancamentos_financeiros(data_lancamento);
  `);
  console.log('✅ Banco de dados inicializado');
}
