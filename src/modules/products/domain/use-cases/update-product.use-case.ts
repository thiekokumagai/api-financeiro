import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IProductsRepository } from '../repositories/iproducts.repository';

@Injectable()
export class UpdateProductUseCase {
  constructor(private readonly productsRepository: IProductsRepository) {}

  async execute(
    id: string,
    dto: {
      title?: string;
      categoryId?: string;
      price?: number;
      costPrice?: number;
      stock?: number;
      isVisible?: boolean;
    },
  ) {
    const product = await this.productsRepository.findById(id);
    if (!product) {
      throw new NotFoundException('Produto não encontrado');
    }

    if (dto.categoryId) {
      const categoryExists = await this.productsRepository.checkCategoryExists(
        dto.categoryId,
      );
      if (!categoryExists) {
        throw new BadRequestException('Categoria não encontrada');
      }
    }

    return this.productsRepository.update(id, dto);
  }
}
