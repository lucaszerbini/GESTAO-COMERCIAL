import { Request, Response, NextFunction } from 'express';
import { resposta, respostaPaginada } from '../middlewares/validar';
import * as produtoService from '../services/produtoService';
import * as pedidoService from '../services/pedidoService';
import * as financeiroService from '../services/financeiroService';
import * as funcionarioService from '../services/funcionarioService';
import * as integracoesService from '../services/integracoesService';

const hoje = () => new Date().toISOString().split('T')[0];
const inicioDoMes = () => hoje().slice(0, 8) + '01';
const query = (req: Request) => req.query as Record<string, string>;

// ── Produtos ─────────────────────────────────────────────────────────────────

export function listar(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', pageSize = '20', busca, categoria, estoqueBaixo } = query(req);
    const resultado = produtoService.listarProdutos({ busca, categoria, estoqueBaixo: estoqueBaixo === 'true', page: +page, pageSize: +pageSize });
    respostaPaginada(res, resultado.produtos, resultado.total, +page, +pageSize);
  } catch (e) { next(e); }
}

export function buscarPorId(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, produtoService.buscarProdutoPorId(+req.params.id));
  } catch (e) { next(e); }
}

export function buscarPorCodigo(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, produtoService.buscarProdutoPorCodigoBarras(req.params.codigo));
  } catch (e) { next(e); }
}

export function criar(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, produtoService.criarProduto(req.body), 201);
  } catch (e) { next(e); }
}

export function atualizar(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, produtoService.atualizarProduto(+req.params.id, req.body));
  } catch (e) { next(e); }
}

export function remover(req: Request, res: Response, next: NextFunction) {
  try {
    produtoService.removerProduto(+req.params.id);
    resposta(res, null, 200, 'Desativado');
  } catch (e) { next(e); }
}

export function movimentarEstoque(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, produtoService.movimentarEstoque({ produto_id: +req.params.id, ...req.body }), 201);
  } catch (e) { next(e); }
}

export function historicoEstoque(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, produtoService.historicoEstoque(+req.params.id));
  } catch (e) { next(e); }
}

export function estoqueBaixo(_req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, produtoService.produtosComEstoqueBaixo());
  } catch (e) { next(e); }
}

export function gerarEAN13(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, { produto_id: +req.params.id, ean13: integracoesService.gerarEAN13(+req.params.id) });
  } catch (e) { next(e); }
}

// ── Pedidos ───────────────────────────────────────────────────────────────────

export function listarPedidos(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', pageSize = '20', status, cliente_id, data_inicio, data_fim } = query(req);
    const resultado = pedidoService.listarPedidos({
      status,
      data_inicio,
      data_fim,
      cliente_id: cliente_id ? +cliente_id : undefined,
      page: +page,
      pageSize: +pageSize,
    });
    respostaPaginada(res, resultado.pedidos, resultado.total, +page, +pageSize);
  } catch (e) { next(e); }
}

export function buscarPedidoPorId(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, pedidoService.buscarPedidoPorId(+req.params.id));
  } catch (e) { next(e); }
}

export function criarPedido(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, pedidoService.criarPedido(req.body), 201);
  } catch (e) { next(e); }
}

export function atualizarStatusPedido(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, pedidoService.atualizarStatusPedido(+req.params.id, req.body.status));
  } catch (e) { next(e); }
}

export function resumoVendas(req: Request, res: Response, next: NextFunction) {
  try {
    const { data_inicio = hoje(), data_fim = hoje() } = query(req);
    resposta(res, pedidoService.resumoVendas(data_inicio, data_fim));
  } catch (e) { next(e); }
}

// ── Financeiro ────────────────────────────────────────────────────────────────

export function listarLancamentos(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', pageSize = '20', data_inicio, data_fim, tipo, categoria } = query(req);
    const resultado = financeiroService.listarLancamentos({
      data_inicio,
      data_fim,
      categoria,
      tipo: tipo as 'receita' | 'despesa' | undefined,
      page: +page,
      pageSize: +pageSize,
    });
    respostaPaginada(res, resultado.lancamentos, resultado.total, +page, +pageSize);
  } catch (e) { next(e); }
}

export function criarLancamento(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, financeiroService.criarLancamento(req.body), 201);
  } catch (e) { next(e); }
}

export function removerLancamento(req: Request, res: Response, next: NextFunction) {
  try {
    financeiroService.removerLancamento(+req.params.id);
    resposta(res, null, 200, 'Removido');
  } catch (e) { next(e); }
}

export function fluxoCaixa(req: Request, res: Response, next: NextFunction) {
  try {
    const { data_inicio = inicioDoMes(), data_fim = hoje() } = query(req);
    resposta(res, financeiroService.resumoFluxoCaixa(data_inicio, data_fim));
  } catch (e) { next(e); }
}

export function fluxoDiario(req: Request, res: Response, next: NextFunction) {
  try {
    const { data_inicio = inicioDoMes(), data_fim = hoje() } = query(req);
    resposta(res, financeiroService.fluxoCaixaDiario(data_inicio, data_fim));
  } catch (e) { next(e); }
}

export function resumoCategoria(req: Request, res: Response, next: NextFunction) {
  try {
    const { data_inicio = inicioDoMes(), data_fim = hoje() } = query(req);
    resposta(res, financeiroService.resumoPorCategoria(data_inicio, data_fim));
  } catch (e) { next(e); }
}

// ── Funcionários ──────────────────────────────────────────────────────────────

export function listarFuncionarios(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', pageSize = '20', busca, ativo } = query(req);
    const filtroAtivo = ativo === 'true' ? true : ativo === 'false' ? false : undefined;
    const resultado = funcionarioService.listarFuncionarios({ busca, ativo: filtroAtivo, page: +page, pageSize: +pageSize });
    respostaPaginada(res, resultado.funcionarios, resultado.total, +page, +pageSize);
  } catch (e) { next(e); }
}

export function buscarFuncionarioPorId(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, funcionarioService.buscarFuncionarioPorId(+req.params.id));
  } catch (e) { next(e); }
}

export function criarFuncionario(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, funcionarioService.criarFuncionario(req.body), 201);
  } catch (e) { next(e); }
}

export function atualizarFuncionario(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, funcionarioService.atualizarFuncionario(+req.params.id, req.body));
  } catch (e) { next(e); }
}

export function demitirFuncionario(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, funcionarioService.demitirFuncionario(+req.params.id, req.body.data_demissao));
  } catch (e) { next(e); }
}

export function calcularSalario(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, funcionarioService.calcularSalario(req.body));
  } catch (e) { next(e); }
}

export function calcularFerias(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, funcionarioService.calcularFerias(req.body));
  } catch (e) { next(e); }
}

// ── Integrações ───────────────────────────────────────────────────────────────

export function gerarCodigoBarras(req: Request, res: Response, next: NextFunction) {
  try {
    const { codigo, formato, largura, altura } = query(req);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.send(integracoesService.gerarCodigoBarrasSVG({
      codigo,
      formato,
      largura: largura ? +largura : undefined,
      altura: altura ? +altura : undefined,
    }));
  } catch (e) { next(e); }
}

export async function enviarBalanca(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, await integracoesService.enviarProdutoParaBalanca(req.params.codigo));
  } catch (e) { next(e); }
}

export async function imprimirPedidoCtrl(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, await integracoesService.imprimirPedido(req.body.pedido_id, req.body.copias));
  } catch (e) { next(e); }
}
