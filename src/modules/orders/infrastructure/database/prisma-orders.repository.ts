import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { TenantContextService } from '../../../tenant/tenant-context.service';
import {
  Order,
  OrderStatus,
  PaymentStatus,
} from '../../domain/entities/order.entity';
import {
  IOrdersRepository,
  OrderFilters,
  PaginatedOrders,
} from '../../domain/repositories/iorders.repository';

@Injectable()
export class PrismaOrdersRepository implements IOrdersRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  private mapToDomain(record: any): Order {
    return new Order({
      id: record.id,
      storeId: record.storeId,
      orderNumber: record.orderNumber,
      customerId: record.customerId,
      customerName: record.customerName,
      customerPhone: record.customerPhone,
      itemsTotal: Number(record.itemsTotal),
      paymentDiscount: Number(record.paymentDiscount || 0),
      installmentSurcharge: Number(record.installmentSurcharge || 0),
      couponDiscount: Number(record.couponDiscount || 0),
      receiptDiscount: Number(record.receiptDiscount || 0),
      receiptSurcharge: Number(record.receiptSurcharge || 0),
      amountProvided: record.amountProvided ? Number(record.amountProvided) : null,
      changeAmount: record.changeAmount ? Number(record.changeAmount) : null,

      totalOrder: Number(record.totalOrder),
      totalReceived: Number(record.totalReceived),
      cardFee: Number(record.cardFee || 0),
      paymentType: record.paymentType,
      paymentMethod: record.paymentMethod,
      pixKey: record.pixKey,
      observation: record.observation,
      couponId: record.couponId,
      coupon: record.coupon
        ? {
            title: record.coupon.title,
            type: record.coupon.type,
          }
        : null,
      status: record.status as OrderStatus,
      paymentStatus: record.paymentStatus as PaymentStatus,
      installments: record.installments,
      paymentDate: record.paymentDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      isPrinted: record.isPrinted,
      items:
        record.items?.map((item: any) => ({
          id: item.id,
          orderId: item.orderId,
          productId: item.productId,
          productName: item.productName,
          price: Number(item.price),
          quantity: item.quantity,
          costPrice: item.product?.costPrice ? Number(item.product.costPrice) : 0,
        })) ?? [],
    });
  }

  async findMany(filters: OrderFilters): Promise<PaginatedOrders> {
    const where: any = {};
    const tenantStoreId = this.tenantContextService.getStoreId();
    if (tenantStoreId) {
      where.storeId = tenantStoreId;
    }

    if (filters.search) {
      where.OR = [
        { customerName: { contains: filters.search, mode: 'insensitive' } },
        { customerPhone: { contains: filters.search, mode: 'insensitive' } },
      ];

      const cleanSearch = filters.search.replace(/\D/g, '');
      if (cleanSearch.length > 0) {
        where.OR.push({ customerPhone: { contains: cleanSearch, mode: 'insensitive' } });
      }

      const numSearch = Number(cleanSearch);
      if (!isNaN(numSearch) && numSearch > 0) {
        where.OR.push({ orderNumber: numSearch });
      }
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.paymentStatus) {
      where.paymentStatus = filters.paymentStatus;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    const page = filters.page ? Math.max(1, Number(filters.page)) : 1;
    const limit = filters.limit ? Math.max(1, Number(filters.limit)) : 10;
    const skip = (page - 1) * limit;

    const total = await this.prisma.order.count({ where });

    const records = await this.prisma.order.findMany({
      where,
      include: {
        coupon: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: records.map((record) => this.mapToDomain(record)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findPaidOrdersByPaymentDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<Order[]> {
    const records = await this.prisma.order.findMany({
      where: {
        paymentStatus: 'PAID',
        paymentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'desc',
      },
    });
    return records.map((record) => this.mapToDomain(record));
  }

  async findById(id: string): Promise<Order | null> {
    const record = await this.prisma.order.findUnique({
      where: { id },
      include: {
        coupon: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!record) return null;
    return this.mapToDomain(record);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<void> {
    await this.prisma.order.update({
      where: { id },
      data: { status },
    });
  }

  async save(order: Order): Promise<Order> {
    const payload = {
      storeId: order.storeId || this.tenantContextService.getStoreId() || undefined,
      customerId: order.customerId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      itemsTotal: order.itemsTotal,
      paymentDiscount: order.paymentDiscount,
      installmentSurcharge: order.installmentSurcharge,
      couponDiscount: order.couponDiscount,
      receiptDiscount: order.receiptDiscount,
      receiptSurcharge: order.receiptSurcharge,
      amountProvided: order.amountProvided,
      changeAmount: order.changeAmount,

      totalOrder: order.totalOrder,
      totalReceived: order.totalReceived,
      paymentType: order.paymentType,
      paymentMethod: order.paymentMethod,
      pixKey: order.pixKey,
      observation: order.observation,
      status: order.status,
      paymentStatus: order.paymentStatus,
      installments: order.installments,
      paymentDate: order.paymentDate,
      cardFee: order.cardFee,
      couponId: order.couponId || undefined,
      isPrinted: order.isPrinted || false,
    };

    let record;
    if (order.id) {
      record = await this.prisma.order.update({
        where: { id: order.id },
        data: payload,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    } else {
      record = await this.prisma.order.create({
        data: {
          ...payload,
          items: {
            create:
              order.items?.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
              })) ?? [],
          },
        } as any,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    }

    return this.mapToDomain(record);
  }

  async saveWithStockDecrement(order: Order): Promise<Order> {
    const record = await this.prisma.$transaction(async (tx) => {
      if (order.items && order.items.length > 0) {
        for (const item of order.items) {
          if (!item.productId) {
            throw new Error(`Item ${item.productName} precisa estar vinculado a um produto`);
          }

          const product = await tx.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new Error(`Produto "${item.productName}" não encontrado.`);
          }

          if (product.stock < item.quantity) {
            throw new Error(
              `Estoque insuficiente para "${item.productName}". Disponível: ${product.stock}, Solicitado: ${item.quantity}`,
            );
          }

          const previousStock = product.stock;
          const newStock = previousStock - item.quantity;

          await tx.product.update({
            where: { id: product.id },
            data: {
              stock: newStock,
              isVisible: newStock > 0 ? product.isVisible : false,
            },
          });

          await tx.stockMovement.create({
            data: {
              storeId: order.storeId || this.tenantContextService.getStoreId() || null,
              type: 'SUBTRACT',
              quantity: item.quantity,
              previousStock,
              newStock,
              observation: `Venda via pedido`,
              productId: product.id,
            },
          });
        }
      }

      let customerIdToLink = order.customerId;

      if (!customerIdToLink && order.customerPhone) {
        let customer = await tx.customer.findFirst({
          where: { phone: order.customerPhone, storeId: order.storeId || null },
        });

        if (!customer) {
          try {
            customer = await tx.customer.create({
              data: {
                name: order.customerName,
                phone: order.customerPhone,
                storeId: order.storeId,
              },
            });
          } catch (e: any) {
            customer = await tx.customer.findFirst({
              where: { phone: order.customerPhone, storeId: order.storeId || null },
            });
          }
        }
        if (customer) {
          customerIdToLink = customer.id;
        }
      }

      const payload = {
        storeId: order.storeId || this.tenantContextService.getStoreId() || undefined,
        customerId: customerIdToLink,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        itemsTotal: order.itemsTotal,
        paymentDiscount: order.paymentDiscount,
        installmentSurcharge: order.installmentSurcharge,
        couponDiscount: order.couponDiscount,
        receiptDiscount: order.receiptDiscount,
        receiptSurcharge: order.receiptSurcharge,
        amountProvided: order.amountProvided,
        changeAmount: order.changeAmount,

        totalOrder: order.totalOrder,
        totalReceived: order.totalReceived,
        paymentType: order.paymentType,
        paymentMethod: order.paymentMethod,
        pixKey: order.pixKey,
        observation: order.observation,
        status: order.status,
        paymentStatus: order.paymentStatus,
        installments: order.installments,
        paymentDate: order.paymentDate,
        cardFee: order.cardFee,
        couponId: order.couponId || undefined,
        isPrinted: order.isPrinted || false,
      };

      const createdOrder = await tx.order.create({
        data: {
          ...payload,
          items: {
            create:
              order.items?.map((item) => ({
                productId: item.productId,
                productName: item.productName,
                price: item.price,
                quantity: item.quantity,
              })) ?? [],
          },
        } as any,
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return createdOrder;
    });

    return this.mapToDomain(record);
  }

  async updateWithStockAdjustment(id: string, newOrder: Order): Promise<Order> {
    const record = await this.prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existingOrder) {
        throw new Error('Pedido não encontrado para atualização.');
      }

      const oldItems = existingOrder.items || [];
      const newItems = newOrder.items || [];

      // Devuelve o estoque dos itens antigos se o pedido anterior não estava cancelado
      if (existingOrder.status !== OrderStatus.CANCELLED) {
        for (const oldItem of oldItems) {
          if (oldItem.productId) {
            const product = await tx.product.findUnique({ where: { id: oldItem.productId } });
            if (product) {
              const previousStock = product.stock;
              const newStock = previousStock + oldItem.quantity;
              await tx.product.update({
                where: { id: product.id },
                data: { stock: newStock },
              });
              await tx.stockMovement.create({
                data: {
                  storeId: existingOrder.storeId,
                  type: 'ADD',
                  quantity: oldItem.quantity,
                  previousStock,
                  newStock,
                  observation: `Devolução por edição do pedido #${existingOrder.orderNumber}`,
                  productId: product.id,
                },
              });
            }
          }
        }
      }

      // Aplica o novo estoque se o novo status não for cancelado
      if (newOrder.status !== OrderStatus.CANCELLED) {
        for (const newItem of newItems) {
          if (newItem.productId) {
            const product = await tx.product.findUnique({ where: { id: newItem.productId } });
            if (!product) {
              throw new Error(`Produto "${newItem.productName}" não encontrado.`);
            }
            if (product.stock < newItem.quantity) {
              throw new Error(
                `Estoque insuficiente para "${newItem.productName}". Disponível: ${product.stock}, Solicitado: ${newItem.quantity}`,
              );
            }
            const previousStock = product.stock;
            const newStock = previousStock - newItem.quantity;
            await tx.product.update({
              where: { id: product.id },
              data: { stock: newStock, isVisible: newStock > 0 ? product.isVisible : false },
            });
            await tx.stockMovement.create({
              data: {
                storeId: existingOrder.storeId,
                type: 'SUBTRACT',
                quantity: newItem.quantity,
                previousStock,
                newStock,
                observation: `Venda por edição do pedido #${existingOrder.orderNumber}`,
                productId: product.id,
              },
            });
          }
        }
      }

      // Remove os itens antigos do pedido
      await tx.orderItem.deleteMany({ where: { orderId: id } });

      // Atualiza o pedido
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          customerName: newOrder.customerName,
          customerPhone: newOrder.customerPhone,
          itemsTotal: newOrder.itemsTotal,
          paymentDiscount: newOrder.paymentDiscount,
          installmentSurcharge: newOrder.installmentSurcharge,
          couponDiscount: newOrder.couponDiscount,
          receiptDiscount: newOrder.receiptDiscount,
          receiptSurcharge: newOrder.receiptSurcharge,
          amountProvided: newOrder.amountProvided,
          changeAmount: newOrder.changeAmount,
          totalOrder: newOrder.totalOrder,
          totalReceived: newOrder.totalReceived,
          paymentType: newOrder.paymentType,
          paymentMethod: newOrder.paymentMethod,
          pixKey: newOrder.pixKey,
          observation: newOrder.observation,
          status: newOrder.status,
          paymentStatus: newOrder.paymentStatus,
          installments: newOrder.installments,
          paymentDate: newOrder.paymentDate,
          cardFee: newOrder.cardFee,
          couponId: newOrder.couponId || undefined,
          isPrinted: newOrder.isPrinted,
          items: {
            create: newItems.map((item) => ({
              productId: item.productId,
              productName: item.productName,
              price: item.price,
              quantity: item.quantity,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return updatedOrder;
    });

    return this.mapToDomain(record);
  }

  async cancelAndRestoreStock(id: string): Promise<Order> {
    const record = await this.prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existingOrder) {
        throw new Error('Pedido não encontrado para cancelamento.');
      }

      if (existingOrder.status === OrderStatus.CANCELLED) {
        return existingOrder;
      }

      for (const item of existingOrder.items) {
        if (item.productId) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (product) {
            const previousStock = product.stock;
            const newStock = previousStock + item.quantity;
            await tx.product.update({
              where: { id: product.id },
              data: { stock: newStock },
            });
            await tx.stockMovement.create({
              data: {
                storeId: existingOrder.storeId,
                type: 'ADD',
                quantity: item.quantity,
                previousStock,
                newStock,
                observation: `Estorno por cancelamento do pedido #${existingOrder.orderNumber}`,
                productId: product.id,
              },
            });
          }
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return updatedOrder;
    });

    return this.mapToDomain(record);
  }

  async recoverAndDecrementStock(id: string, newStatus: OrderStatus): Promise<Order> {
    const record = await this.prisma.$transaction(async (tx) => {
      const existingOrder = await tx.order.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!existingOrder) {
        throw new Error('Pedido não encontrado.');
      }

      if (existingOrder.status !== OrderStatus.CANCELLED) {
        return existingOrder;
      }

      for (const item of existingOrder.items) {
        if (item.productId) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product) {
            throw new Error(`Produto "${item.productName}" não encontrado.`);
          }
          if (product.stock < item.quantity) {
            throw new Error(
              `Estoque insuficiente para "${item.productName}". Disponível: ${product.stock}, Solicitado: ${item.quantity}`,
            );
          }
          const previousStock = product.stock;
          const newStock = previousStock - item.quantity;
          await tx.product.update({
            where: { id: product.id },
            data: { stock: newStock, isVisible: newStock > 0 ? product.isVisible : false },
          });
          await tx.stockMovement.create({
            data: {
              storeId: existingOrder.storeId,
              type: 'SUBTRACT',
              quantity: item.quantity,
              previousStock,
              newStock,
              observation: `Reabertura do pedido #${existingOrder.orderNumber}`,
              productId: product.id,
            },
          });
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: newStatus },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return updatedOrder;
    });

    return this.mapToDomain(record);
  }
}
