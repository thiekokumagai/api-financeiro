import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CreateCategoryDto } from '../dtos/create-category.dto';
import { UpdateCategoryDto, UpdateOrderDto } from '../dtos/update-category.dto';
import { CategoryResponseDto } from '../dtos/category-response.dto';

import { ListCategoriesUseCase } from '../../domain/use-cases/list-categories.use-case';
import { GetCategoryUseCase } from '../../domain/use-cases/get-category.use-case';
import { CreateCategoryUseCase } from '../../domain/use-cases/create-category.use-case';
import { UpdateCategoryUseCase } from '../../domain/use-cases/update-category.use-case';
import { UpdateBatchOrderUseCase } from '../../domain/use-cases/update-batch-order.use-case';
import { DeleteCategoryUseCase } from '../../domain/use-cases/delete-category.use-case';

@ApiTags('Categories')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly getCategoryUseCase: GetCategoryUseCase,
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly updateBatchOrderUseCase: UpdateBatchOrderUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar categorias' })
  @ApiResponse({
    status: 200,
    type: [CategoryResponseDto],
  })
  findAll() {
    return this.listCategoriesUseCase.execute();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Criar categoria' })
  @ApiResponse({
    status: 201,
    type: CategoryResponseDto,
  })
  async create(@Body() body: CreateCategoryDto) {
    return this.createCategoryUseCase.execute({
      title: body.title,
      image: null,
      isVisible: body.isVisible ?? true,
      excludeFromBestSeller: body.excludeFromBestSeller ?? false,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar categoria' })
  async update(
    @Param('id') id: string,
    @Body() body: UpdateCategoryDto,
  ) {
    return this.updateCategoryUseCase.execute(id, {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.isVisible !== undefined && { isVisible: body.isVisible }),
      ...(body.excludeFromBestSeller !== undefined && { excludeFromBestSeller: body.excludeFromBestSeller }),
    });
  }

  @Patch('batch/order')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reordenar categorias' })
  async updateBatchOrder(@Body() body: UpdateOrderDto) {
    await this.updateBatchOrderUseCase.execute(body.items);
    return { success: true };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar categoria' })
  async delete(@Param('id') id: string) {
    await this.deleteCategoryUseCase.execute(id);
  }
}
