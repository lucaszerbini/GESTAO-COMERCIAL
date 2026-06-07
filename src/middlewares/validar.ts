import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ApiResponse } from '../types';

export function validar(schema: ZodSchema, alvo: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const resultado = schema.safeParse(req[alvo]);
    if (!resultado.success) {
      const erros = resultado.error.errors.map(e => `${e.path.join('.')}: ${e.message}`);
      res.status(400).json({ success: false, message: 'Dados inválidos', errors: erros } satisfies ApiResponse);
      return;
    }
    req[alvo] = resultado.data;
    next();
  };
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction): void {
  console.error('❌', err.message);
  if (err instanceof ZodError) {
    const erros = err.errors.map(e => `${e.path.join('.')}: ${e.message}`);
    res.status(400).json({ success: false, message: 'Erro de validação', errors: erros } satisfies ApiResponse);
    return;
  }
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ success: false, message: err.message } satisfies ApiResponse);
    return;
  }
  res.status(500).json({ success: false, message: 'Erro interno do servidor' } satisfies ApiResponse);
}

export class AppError extends Error {
  constructor(message: string, public readonly statusCode: number = 400) {
    super(message);
    this.name = 'AppError';
  }
}

export function resposta<T>(res: Response, data: T, statusCode = 200, message?: string): void {
  res.status(statusCode).json({ success: true, data, message } satisfies ApiResponse<T>);
}

export function respostaPaginada<T>(res: Response, data: T[], total: number, page: number, pageSize: number): void {
  res.status(200).json({
    success: true,
    data,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  } satisfies ApiResponse<T[]>);
}
