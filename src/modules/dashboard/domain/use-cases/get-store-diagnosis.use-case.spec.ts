import { ForbiddenException } from '@nestjs/common';
import { GetStoreDiagnosisUseCase } from './get-store-diagnosis.use-case';

const order = (over: any = {}) => ({
  couponDiscount: '0',
  paymentDiscount: '0',
  receiptDiscount: '0',
  cardFee: '0',
  paymentMethod: 'PIX',
  coupon: null,
  ...over,
});

function build(overrides: any = {}) {
  const prisma = {
    order: {
      findMany: jest.fn().mockResolvedValue(overrides.orders ?? []),
      aggregate: jest.fn().mockResolvedValue(
        overrides.cancelled ?? { _count: { _all: 0 }, _sum: { totalOrder: null } },
      ),
    },
    fixedCost: { findMany: jest.fn().mockResolvedValue(overrides.fixedCosts ?? []) },
  } as any;

  const stats = {
    execute: jest.fn().mockResolvedValue({
      stats: {
        lucroBruto: 1000,
        margemBruta: 40,
        receitaItens: 3000,
        descontosConcedidos: 500,
        totalPedidos: 10,
        visitas: 0,
        conversao: 0,
      },
      semCusto: { count: 0, receitaLiquida: 0 },
      bestSellers: [],
    }),
  } as any;

  const stock = {
    execute: jest.fn().mockResolvedValue({
      kpis: { stagnantCapital: 0, stagnantCount: 0, outOfStockCount: 0 },
    }),
  } as any;

  return { prisma, stats, stock, uc: new GetStoreDiagnosisUseCase(prisma, stats, stock) };
}

describe('GetStoreDiagnosisUseCase', () => {
  it('recusa consulta sem storeId (não soma todas as lojas)', async () => {
    const { uc, prisma, stats } = build();
    await expect(uc.execute({})).rejects.toBeInstanceOf(ForbiddenException);
    expect(stats.execute).not.toHaveBeenCalled();
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it('todas as consultas filtram pela loja', async () => {
    const { uc, prisma, stats, stock } = build();
    await uc.execute({ storeId: 's1' });
    expect(stats.execute.mock.calls[0][0].storeId).toBe('s1');
    expect(prisma.order.findMany.mock.calls[0][0].where.storeId).toBe('s1');
    expect(prisma.order.aggregate.mock.calls[0][0].where.storeId).toBe('s1');
    expect(prisma.fixedCost.findMany.mock.calls[0][0].where.storeId).toBe('s1');
    expect(stock.execute).toHaveBeenCalledWith('s1');
  });

  it('pedidos cancelados ficam fora das contas e entram só no item de cancelamentos', async () => {
    const { uc, prisma } = build({
      cancelled: { _count: { _all: 2 }, _sum: { totalOrder: '150.00' } },
    });
    const r = await uc.execute({ storeId: 's1' });
    expect(prisma.order.findMany.mock.calls[0][0].where.status).toEqual({ not: 'CANCELLED' });
    expect(prisma.order.aggregate.mock.calls[0][0].where.status).toBe('CANCELLED');
    expect(r.itens.find((i) => i.id === 'cancelamentos')).toMatchObject({ amount: 150 });
  });

  it('lucro líquido = lucro bruto - custo fixo proporcional (30 dias = mensal inteiro)', async () => {
    const { uc } = build({
      fixedCosts: [
        { name: 'Aluguel', value: '1200', repeats: true, createdAt: new Date('2025-01-01') },
        { name: 'Internet', value: '300', repeats: true, createdAt: new Date('2025-01-01') },
      ],
    });
    const r = await uc.execute({
      storeId: 's1',
      startDate: '2026-11-01T00:00:00.000Z',
      endDate: '2026-11-30T23:59:59.999Z',
    });
    expect(r.periodo.dias).toBe(30);
    expect(r.resultado.custosFixos).toBe(1500);
    expect(r.resultado.lucroLiquido).toBe(-500); // 1000 - 1500
    // equilíbrio: 1500 / 0,40 = 3750 em itens; receita líquida por pedido = (3000-500)/10 = 250 => 15 pedidos
    expect(r.resultado.pontoEquilibrioReceita).toBe(3750);
    expect(r.resultado.pontoEquilibrioPedidos).toBe(15);
    expect(r.itens.find((i) => i.id === 'resultado')?.severity).toBe('critical');
  });

  it('sem datas usa o dia de hoje (1 dia = 1/30 do custo mensal)', async () => {
    const { uc } = build({
      fixedCosts: [{ name: 'Aluguel', value: '3000', repeats: true, createdAt: new Date('2025-01-01') }],
    });
    const r = await uc.execute({ storeId: 's1' });
    expect(r.periodo.dias).toBe(1);
    expect(r.resultado.custosFixos).toBe(100);
  });

  it('descontos, cupom campeão e taxa de cartão vêm dos pedidos válidos', async () => {
    const { uc } = build({
      orders: [
        order({ couponDiscount: '30', coupon: { title: 'PROMO10' } }),
        order({ couponDiscount: '20', paymentDiscount: '10', cardFee: '12', paymentMethod: 'Cartão de Crédito', coupon: { title: 'PROMO10' } }),
      ],
    });
    const r = await uc.execute({ storeId: 's1' });
    const d = r.itens.find((i) => i.id === 'descontos');
    expect(d?.amount).toBe(60);
    expect(d?.detail).toContain('PROMO10');
    expect(r.itens.find((i) => i.id === 'taxa-cartao')?.amount).toBe(12);
  });

  it('não gera itens de frete nem de carrinhos abandonados (não existem neste sistema)', async () => {
    const { uc } = build();
    const r = await uc.execute({ storeId: 's1' });
    const ids = r.itens.map((i) => i.id);
    expect(ids).not.toContain('frete');
    expect(ids).not.toContain('carrinhos-abandonados');
  });
});
