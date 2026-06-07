import { Router } from 'express';
import { validar } from '../middlewares/validar';
import {
  criarClienteSchema, atualizarClienteSchema,
  criarProdutoSchema, atualizarProdutoSchema, movimentacaoEstoqueSchema,
  criarPedidoSchema, atualizarStatusPedidoSchema,
  criarLancamentoSchema,
  criarFuncionarioSchema, atualizarFuncionarioSchema, calcularSalarioSchema, calcularFeriasSchema, demitirFuncionarioSchema,
  imprimirPedidoSchema,
} from '../models/schemas';
import * as clienteController from '../controllers/clienteController';
import * as controller from '../controllers/index';

const router = Router();

// ── Health ────────────────────────────────────────────────────────────────────

router.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── Clientes ──────────────────────────────────────────────────────────────────

router.get('/clientes',                 clienteController.listar);
router.post('/clientes',                validar(criarClienteSchema), clienteController.criar);
router.get('/clientes/:id',             clienteController.buscarPorId);
router.get('/clientes/:id/historico',   clienteController.historico);
router.patch('/clientes/:id',           validar(atualizarClienteSchema), clienteController.atualizar);
router.delete('/clientes/:id',          clienteController.remover);

// ── Produtos ──────────────────────────────────────────────────────────────────

router.get('/produtos',                 controller.listar);
router.post('/produtos',                validar(criarProdutoSchema), controller.criar);
router.get('/produtos/estoque-baixo',   controller.estoqueBaixo);
router.get('/produtos/codigo/:codigo',  controller.buscarPorCodigo);
router.get('/produtos/:id',             controller.buscarPorId);
router.get('/produtos/:id/estoque',     controller.historicoEstoque);
router.get('/produtos/:id/ean13',       controller.gerarEAN13);
router.patch('/produtos/:id',           validar(atualizarProdutoSchema), controller.atualizar);
router.delete('/produtos/:id',          controller.remover);
router.post('/produtos/:id/movimentar', validar(movimentacaoEstoqueSchema), controller.movimentarEstoque);

// ── Pedidos ───────────────────────────────────────────────────────────────────

router.get('/pedidos',                  controller.listarPedidos);
router.post('/pedidos',                 validar(criarPedidoSchema), controller.criarPedido);
router.get('/pedidos/resumo',           controller.resumoVendas);
router.get('/pedidos/:id',              controller.buscarPedidoPorId);
router.patch('/pedidos/:id/status',     validar(atualizarStatusPedidoSchema), controller.atualizarStatusPedido);

// ── Financeiro ────────────────────────────────────────────────────────────────

router.get('/financeiro',               controller.listarLancamentos);
router.post('/financeiro',              validar(criarLancamentoSchema), controller.criarLancamento);
router.get('/financeiro/fluxo-caixa',  controller.fluxoCaixa);
router.get('/financeiro/diario',        controller.fluxoDiario);
router.get('/financeiro/categorias',    controller.resumoCategoria);
router.delete('/financeiro/:id',        controller.removerLancamento);

// ── Funcionários ──────────────────────────────────────────────────────────────

router.get('/funcionarios',                         controller.listarFuncionarios);
router.post('/funcionarios',                        validar(criarFuncionarioSchema), controller.criarFuncionario);
router.get('/funcionarios/:id',                     controller.buscarFuncionarioPorId);
router.patch('/funcionarios/:id',                   validar(atualizarFuncionarioSchema), controller.atualizarFuncionario);
router.post('/funcionarios/:id/demitir',            validar(demitirFuncionarioSchema), controller.demitirFuncionario);
router.post('/funcionarios/calcular-salario',       validar(calcularSalarioSchema), controller.calcularSalario);
router.post('/funcionarios/calcular-ferias',        validar(calcularFeriasSchema), controller.calcularFerias);

// ── Integrações ───────────────────────────────────────────────────────────────

router.get('/barcode',                  controller.gerarCodigoBarras);
router.post('/balanca/:codigo',         controller.enviarBalanca);
router.post('/imprimir',                validar(imprimirPedidoSchema), controller.imprimirPedidoCtrl);

export default router;
