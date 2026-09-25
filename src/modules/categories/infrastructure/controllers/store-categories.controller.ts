import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../../../auth/infrastructure/decorators/public.decorator';
import { ListCategoriesUseCase } from '../../domain/use-cases/list-categories.use-case';

const storeCategoriesCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 30 * 1000;

export function clearStoreCategoriesCache() {
  storeCategoriesCache.clear();
}

@ApiTags('Store Categories')
@Public()
@Controller('store/categories')
export class StoreCategoriesController {
  constructor(
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias para a loja (somente ativas)' })
  async findAll() {
    const cached = storeCategoriesCache.get('all');
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }

    const categories = await this.listCategoriesUseCase.execute();
    const result = categories.filter(c => c.isVisible !== false);

    storeCategoriesCache.set('all', { data: result, timestamp: now });
    return result;
  }
}
