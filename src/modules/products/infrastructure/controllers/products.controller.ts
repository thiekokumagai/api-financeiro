import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';

import { CreateProductDto } from '../dtos/create-product.dto';
import { ListProductsDto } from '../dtos/list-products.dto';
import { ProductResponseDto } from '../dtos/product-response.dto';
import { UpdateProductDto } from '../dtos/update-product.dto';
import { UpdateProductStockDto } from '../dtos/update-product-stock.dto';

import { ListProductsUseCase } from '../../domain/use-cases/list-products.use-case';
import { FindProductByIdUseCase } from '../../domain/use-cases/find-product-by-id.use-case';
import { CreateProductUseCase } from '../../domain/use-cases/create-product.use-case';
import { UpdateProductUseCase } from '../../domain/use-cases/update-product.use-case';
import { UpdateProductStockUseCase } from '../../domain/use-cases/update-product-stock.use-case';
import { GetStockHistoryUseCase } from '../../domain/use-cases/get-stock-history.use-case';
import { DeleteProductUseCase } from '../../domain/use-cases/delete-product.use-case';
import { DuplicateProductUseCase } from '../../domain/use-cases/duplicate-product.use-case';

@ApiTags('Products')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(
    private readonly listProductsUseCase: ListProductsUseCase,
    private readonly findProductByIdUseCase: FindProductByIdUseCase,
    private readonly createProductUseCase: CreateProductUseCase,
    private readonly updateProductUseCase: UpdateProductUseCase,
    private readonly updateProductStockUseCase: UpdateProductStockUseCase,
    private readonly getStockHistoryUseCase: GetStockHistoryUseCase,
    private readonly deleteProductUseCase: DeleteProductUseCase,
    private readonly duplicateProductUseCase: DuplicateProductUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar produtos' })
  @ApiResponse({
    status: 200,
    description: 'Lista de produtos',
    type: [ProductResponseDto],
  })
  async findAll(
    @Query() query: ListProductsDto,
    @Res({ passthrough: true }) res: any,
  ) {
    const { products, total } = await this.listProductsUseCase.execute(query);
    res.header('x-total-count', total.toString());
    return products;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar produto completo' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do produto',
    type: ProductResponseDto,
  })
  async findOne(@Param('id') id: string) {
    return this.findProductByIdUseCase.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Criar produto' })
  @ApiResponse({
    status: 201,
    description: 'Produto criado com sucesso',
    type: ProductResponseDto,
  })
  create(@Body() dto: CreateProductDto) {
    return this.createProductUseCase.execute(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar produto' })
  @ApiResponse({
    status: 200,
    description: 'Produto atualizado com sucesso',
    type: ProductResponseDto,
  })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.updateProductUseCase.execute(id, dto);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Atualizar estoque do produto' })
  updateStock(
    @Param('id') id: string,
    @Body() dto: UpdateProductStockDto,
  ) {
    return this.updateProductStockUseCase.execute(id, dto);
  }

  @Get(':id/stock-history')
  @ApiOperation({ summary: 'Obter histórico de movimentações de estoque' })
  getStockHistory(@Param('id') id: string) {
    return this.getStockHistoryUseCase.execute(id);
  }

  @Post(':id/duplicate')
  @ApiOperation({ summary: 'Duplicar produto completo com estoque zerado' })
  duplicate(@Param('id') id: string) {
    return this.duplicateProductUseCase.execute(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    return this.deleteProductUseCase.execute(id);
  }
}
