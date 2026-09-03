import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { TenantContextService } from '../../../tenant/tenant-context.service';
import {
  IProductsRepository,
  ProductWithDetails,
} from '../../domain/repositories/iproducts.repository';
import { Product } from '@prisma/client';

@Injectable()
export class PrismaProductsRepository implements IProductsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async create(data: {
    title: string;
    categoryId: string;
    price?: number | null;
    costPrice?: number | null;
    stock?: number;
    isVisible?: boolean;
  }): Promise<Product> {
    const storeId = this.tenantContextService.getStoreId() || undefined;

    return this.prisma.product.create({
      data: {
        title: data.title,
        categoryId: data.categoryId,
        price: data.price ?? null,
        costPrice: data.costPrice ?? null,
        stock: data.stock ?? 0,
        isVisible: data.isVisible ?? true,
        storeId,
      },
    });
  }

  async update(
    id: string,
    data: {
      title?: string;
      categoryId?: string;
      price?: number | null;
      costPrice?: number | null;
      stock?: number;
      isVisible?: boolean;
    },
  ): Promise<Product> {
    const storeId = this.tenantContextService.getStoreId() || undefined;

    return this.prisma.product.update({
      where: { id, storeId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.price !== undefined && { price: data.price }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
      },
    });
  }

  async findAll(params: {
    skip: number;
    take: number;
    search?: string;
    categoryId?: string;
    isVisible?: boolean;
  }): Promise<ProductWithDetails[]> {
    const storeId = this.tenantContextService.getStoreId() || undefined;

    const where: any = {
      storeId,
      deletedAt: null,
    };

    const searchWords = params.search?.trim().split(/\s+/).filter(Boolean);
    if (searchWords && searchWords.length > 0) {
      where.AND = searchWords.map((word) => ({
        OR: [
          { title: { contains: word, mode: 'insensitive' } },
          { category: { title: { contains: word, mode: 'insensitive' } } },
        ],
      }));
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.isVisible !== undefined) {
      where.isVisible = params.isVisible;
    }

    return this.prisma.product.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
      },
    });
  }

  async count(params: {
    search?: string;
    categoryId?: string;
    isVisible?: boolean;
  }): Promise<number> {
    const storeId = this.tenantContextService.getStoreId() || undefined;

    const searchWords = params.search?.trim().split(/\s+/).filter(Boolean);

    const where: any = {
      storeId,
      deletedAt: null,
    };

    if (searchWords && searchWords.length > 0) {
      where.AND = searchWords.map((word) => ({
        OR: [
          { title: { contains: word, mode: 'insensitive' } },
          { category: { title: { contains: word, mode: 'insensitive' } } },
        ],
      }));
    }

    if (params.categoryId) {
      where.categoryId = params.categoryId;
    }

    if (params.isVisible !== undefined) {
      where.isVisible = params.isVisible;
    }

    return this.prisma.product.count({ where });
  }

  async findById(id: string): Promise<ProductWithDetails | null> {
    const storeId = this.tenantContextService.getStoreId() || undefined;

    return this.prisma.product.findFirst({
      where: { id, storeId, deletedAt: null },
      include: {
        category: true,
      },
    });
  }

  async checkCategoryExists(categoryId: string): Promise<boolean> {
    const storeId = this.tenantContextService.getStoreId() || undefined;
    const count = await this.prisma.category.count({
      where: { id: categoryId, storeId, deletedAt: null },
    });
    return count > 0;
  }

  async updateStock(
    productId: string,
    type: 'ADD' | 'SUBTRACT' | 'SET',
    quantity: number,
    observation?: string,
  ): Promise<Product> {
    const storeId = this.tenantContextService.getStoreId() || undefined;

    const product = await this.prisma.product.findFirst({
      where: { id: productId, storeId, deletedAt: null },
    });

    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    const previousStock = product.stock;
    let newStock = previousStock;

    if (type === 'ADD') {
      newStock = previousStock + quantity;
    } else if (type === 'SUBTRACT') {
      newStock = Math.max(0, previousStock - quantity);
    } else if (type === 'SET') {
      newStock = Math.max(0, quantity);
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: { stock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          storeId,
          productId,
          type,
          quantity,
          previousStock,
          newStock,
          observation: observation || null,
        },
      });

      return updatedProduct;
    });
  }

  async getStockHistory(productId: string): Promise<any[]> {
    const storeId = this.tenantContextService.getStoreId() || undefined;

    return this.prisma.stockMovement.findMany({
      where: { productId, storeId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async softDelete(id: string): Promise<void> {
    const storeId = this.tenantContextService.getStoreId() || undefined;

    await this.prisma.product.update({
      where: { id, storeId },
      data: { deletedAt: new Date() },
    });
  }

  async duplicate(id: string): Promise<ProductWithDetails> {
    const storeId = this.tenantContextService.getStoreId() || undefined;

    const original = await this.prisma.product.findFirst({
      where: { id, storeId, deletedAt: null },
    });

    if (!original) {
      throw new NotFoundException('Produto não encontrado para duplicação');
    }

    return this.prisma.product.create({
      data: {
        storeId,
        title: `${original.title} (Cópia)`,
        categoryId: original.categoryId,
        price: original.price,
        costPrice: original.costPrice,
        stock: original.stock,
        isVisible: original.isVisible,
      },
      include: {
        category: true,
      },
    });
  }
}
