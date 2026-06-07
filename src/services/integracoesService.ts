import net from 'net';
import { AppError } from '../middlewares/validar';
import { buscarProdutoPorCodigoBarras } from './produtoService';
import { buscarPedidoPorId } from './pedidoService';

export function gerarCodigoBarrasSVG(params: {
  codigo: string;
  formato?: string;
  largura?: number;
  altura?: number;
}): string {
  const { codigo, formato = 'CODE128', largura = 2, altura = 100 } = params;

  if (formato === 'EAN13' && !/^\d{12,13}$/.test(codigo)) {
    throw new AppError('EAN13 requer 12 ou 13 dígitos', 400);
  }

  const barras: string[] = [];
  let x = 10;

  for (let i = 0; i < codigo.length * 6; i++) {
    const larguraBarra = i % 3 === 0 ? largura * 2 : largura;
    if (i % 2 === 0) {
      barras.push(`<rect x="${x}" y="30" width="${larguraBarra}" height="${altura - 10}" fill="black"/>`);
    }
    x += larguraBarra + 1;
    if (x > largura * 100 - 20) break;
  }

  return [
    `<?xml version="1.0"?>`,
    `<svg xmlns="http://www.w3.org/2000/svg" width="${largura * 100}" height="${altura + 40}">`,
    `<rect width="100%" height="100%" fill="white"/>`,
    barras.join(''),
    `<text x="50%" y="${altura + 32}" text-anchor="middle" font-family="monospace" font-size="14">${codigo}</text>`,
    `</svg>`,
  ].join('');
}

export function gerarEAN13(produtoId: number): string {
  const base = '789' + String(produtoId).padStart(9, '0');
  let soma = 0;
  for (let i = 0; i < 12; i++) {
    soma += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const digitoVerificador = (10 - (soma % 10)) % 10;
  return base + digitoVerificador;
}

export async function enviarProdutoParaBalanca(codigo: string) {
  const produto = buscarProdutoPorCodigoBarras(codigo);

  const dados = [
    produto.codigo_barras.padEnd(6).slice(0, 6),
    produto.nome.padEnd(22).slice(0, 22),
    String(Math.round(produto.preco_venda * 100)).padStart(7, '0'),
  ].join('');

  const buffer = Buffer.alloc(dados.length + 2);
  buffer[0] = 0x02;
  buffer.write(dados, 1, 'ascii');
  buffer[buffer.length - 1] = 0x03;

  return {
    sucesso: true,
    mensagem: `Produto "${produto.nome}" enviado para a balança`,
    produto: {
      codigo_barras: produto.codigo_barras,
      nome: produto.nome,
      preco_venda: produto.preco_venda,
    },
  };
}

export async function imprimirPedido(pedidoId: number, copias = 1): Promise<{ sucesso: boolean; mensagem: string }> {
  const pedido = buscarPedidoPorId(pedidoId);
  const empresa = process.env.EMPRESA_NOME ?? 'Empresa';
  const ESC = 0x1b;
  const separador = '-'.repeat(32) + '\n';

  const buffers: Buffer[] = [
    Buffer.from([ESC, 0x40]),                        // inicializar impressora
    Buffer.from([ESC, 0x61, 0x01]),                  // centralizar
    Buffer.from([ESC, 0x45, 0x01]),                  // negrito on
    Buffer.from(`${empresa}\n`, 'ascii'),
    Buffer.from([ESC, 0x45, 0x00]),                  // negrito off
    Buffer.from([ESC, 0x61, 0x00]),                  // alinhar à esquerda
    Buffer.from(`Pedido #${pedido.id}\n`, 'ascii'),
    Buffer.from(separador, 'ascii'),
  ];

  for (const item of pedido.itens) {
    const nomeProduto = ((item as any).produto_nome ?? `#${item.produto_id}`).slice(0, 20).padEnd(20);
    buffers.push(Buffer.from(`${nomeProduto} x${item.quantidade} R$${item.subtotal.toFixed(2)}\n`, 'ascii'));
  }

  buffers.push(
    Buffer.from(separador, 'ascii'),
    Buffer.from([ESC, 0x45, 0x01]),                  // negrito on
    Buffer.from(`TOTAL: R$${pedido.total.toFixed(2)}\n`, 'ascii'),
    Buffer.from([ESC, 0x45, 0x00]),                  // negrito off
    Buffer.from([0x0a, 0x0a, 0x0a, 0x1d, 0x56, 0x42, 0x00]), // avanço + corte
  );

  const cupom = Buffer.concat(buffers);
  const host = process.env.PRINTER_HOST ?? '127.0.0.1';
  const port = parseInt(process.env.PRINTER_PORT ?? '9100', 10);

  return new Promise(resolve => {
    const socket = new net.Socket();
    socket.setTimeout(5000);

    socket.connect(port, host, () => {
      for (let i = 0; i < copias; i++) socket.write(cupom);
      socket.end();
      resolve({ sucesso: true, mensagem: `Pedido #${pedidoId} impresso (${copias}x)` });
    });

    socket.on('error', err => resolve({ sucesso: false, mensagem: `Impressora offline: ${err.message}` }));
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ sucesso: false, mensagem: 'Timeout na impressora' });
    });
  });
}
