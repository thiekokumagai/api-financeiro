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
import { ComputeStockIntelligenceUseCase } from './domain/use-cases/compute-stock-intelligence.use-case';
import { StockIntelligenceCronService } from './infrastructure/cron/stock-intelligence.cron.service';
import { ProductsRankingCronService } from './infrastructure/cron/products-ranking.cron.service';

import { SettingsModule } from '../settings/settings.module';
import { PushNotificationService } from '../../shared/services/push-notification.service';

@Module({
  imports: [SettingsModule],
  controllers: [ProductsController, StoreProductsController],
  providers: [
    PushNotificationService,
    ListProductsUseCase,
    FindProductByIdUseCase,
    CreateProductUseCase,
    UpdateProductUseCase,
    UpdateProductStockUseCase,
    GetStockHistoryUseCase,
    DeleteProductUseCase,
    DuplicateProductUseCase,
    ComputeStockIntelligenceUseCase,
    ProductsRankingCronService,
    StockIntelligenceCronService,
    {
      provide: IProductsRepository,
      useClass: PrismaProductsRepository,
    },
  ],
  exports: [IProductsRepository, ComputeStockIntelligenceUseCase],
})
export class ProductsModule {}
