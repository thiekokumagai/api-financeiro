import { Module } from '@nestjs/common';
import { ProductsController } from './infrastructure/controllers/products.controller';
import { StoreProductsController } from './infrastructure/controllers/store-products.controller';
import { IProductsRepository } from './domain/repositories/iproducts.repository';
import { PrismaProductsRepository } from './infrastructure/database/prisma-products.repository';

import { ListProductsUseCase } from './domain/use-cases/list-products.use-case';
import { FindProductByIdUseCase } from './domain/use-cases/find-product-by-id.use-case';
import { CreateProductUseCase } from './domain/use-cases/create-product.use-case';
import { UpdateProductUseCase } from './domain/use-cases/update-product.use-case';
import { UpdateProductStockUseCase } from './domain/use-cases/update-product-stock.use-case';
import { GetStockHistoryUseCase } from './domain/use-cases/get-stock-history.use-case';
import { DeleteProductUseCase } from './domain/use-cases/delete-product.use-case';
import { DuplicateProductUseCase } from './domain/use-cases/duplicate-product.use-case';
import { ProductsRankingCronService } from './infrastructure/cron/products-ranking.cron.service';

@Module({
  imports: [],
  controllers: [ProductsController, StoreProductsController],
  providers: [
    ListProductsUseCase,
    FindProductByIdUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    UpdateProductStockUseCase,
    GetStockHistoryUseCase,
    DeleteProductUseCase,
    DuplicateProductUseCase,
    ProductsRankingCronService,
    {
      provide: IProductsRepository,
      useClass: PrismaProductsRepository,
    },
  ],
  exports: [IProductsRepository],
})
export class ProductsModule {}
