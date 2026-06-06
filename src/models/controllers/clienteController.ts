// Controller de clientes
import { Request, Response, NextFunction } from 'express';
import * as clienteService from '../services/clienteService';
import { resposta, respostaPaginada } from '../middlewares/validar';

export function listar(req: Request, res: Response, next: NextFunction) {
  try {
    const { page = '1', pageSize = '20', busca } = req.query as Record<string, string>;
    const resultado = clienteService.listarClientes({ busca, page: +page, pageSize: +pageSize });
    respostaPaginada(res, resultado.clientes, resultado.total, +page, +pageSize);
  } catch (e) { next(e); }
}

export function buscarPorId(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, clienteService.buscarClientePorId(+req.params.id));
  } catch (e) { next(e); }
}

export function criar(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, clienteService.criarCliente(req.body), 201, 'Cliente criado');
  } catch (e) { next(e); }
}

export function atualizar(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, clienteService.atualizarCliente(+req.params.id, req.body));
  } catch (e) { next(e); }
}

export function remover(req: Request, res: Response, next: NextFunction) {
  try {
    clienteService.removerCliente(+req.params.id);
    resposta(res, null, 200, 'Cliente removido');
  } catch (e) { next(e); }
}

export function historico(req: Request, res: Response, next: NextFunction) {
  try {
    resposta(res, clienteService.historicoCliente(+req.params.id));
  } catch (e) { next(e); }
}
