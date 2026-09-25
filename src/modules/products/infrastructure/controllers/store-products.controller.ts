import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../../auth/infrastructure/decorators/public.decorator';
import { ListProductsUseCase } from '../../domain/use-cases/list-products.use-case';
import { FindProductByIdUseCase } from '../../domain/use-cases/find-product-by-id.use-case';
import { ListProductsDto } from '../dtos/list-products.dto';

const storeProductsCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 30 * 1000; // 30 segundos em memória no servidor

export function clearStoreProductsCache() {
  storeProductsCache.clear();
}

@ApiTags('Store Products')
@Public()
@Controller('store/products')
export class StoreProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly findProductByIdUseCase: FindProductByIdUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtos para a loja (somente ativos)' })
  async findAll(@Query() query: ListProductsDto) {
    const cacheKey = JSON.stringify(query);
    const cached = storeProductsCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const { products, total } = await this.listProductsUseCase.execute({
      ...query,
      limit: query.limit || 1000,
      isVisible: true,
    });
    
    const result = {
      data: products,
      total,
    };

    storeProductsCache.set(cacheKey, { data: result, timestamp: now });
    if (storeProductsCache.size > 200) {
      storeProductsCache.clear();
    }

    return result;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto completo para a loja' })
  async findOne(@Param('id') id: string) {
    return this.findProductByIdUseCase.execute(id);
  }
}
