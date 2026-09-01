import { Product } from '@prisma/client';

export type ProductWithDetails = Product & {
  category?: any;
};

export abstract class IProductsRepository {
  abstract create(data: {
    title: string;
    categoryId: string;
    price?: number | null;
    costPrice?: number | null;
    stock?: number;
    isVisible?: boolean;
  }): Promise<Product>;

  abstract update(
    id: string,
    data: {
      title?: string;
      categoryId?: string;
      price?: number | null;
      costPrice?: number | null;
      stock?: number;
      isVisible?: boolean;
    },
  ): Promise<Product>;

  abstract findAll(params: {
    skip: number;
    take: number;
    search?: string;
    categoryId?: string;
    isVisible?: boolean;
  }): Promise<ProductWithDetails[]>;

  abstract count(params: {
    search?: string;
    categoryId?: string;
    isVisible?: boolean;
  }): Promise<number>;

  abstract findById(id: string): Promise<ProductWithDetails | null>;

  abstract checkCategoryExists(categoryId: string): Promise<boolean>;

  abstract updateStock(
    productId: string,
    type: 'ADD' | 'SUBTRACT' | 'SET',
    quantity: number,
    observation?: string,
  ): Promise<Product>;

  abstract getStockHistory(productId: string): Promise<any[]>;

  abstract softDelete(id: string): Promise<void>;

  abstract duplicate(id: string): Promise<ProductWithDetails>;
}
