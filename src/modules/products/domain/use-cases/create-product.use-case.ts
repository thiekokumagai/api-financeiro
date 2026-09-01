import { Injectable, BadRequestException } from '@nestjs/common';
import { IProductsRepository } from '../repositories/iproducts.repository';

@Injectable()
export class CreateProductUseCase {
  constructor(private readonly productsRepository: IProductsRepository) {}

  async execute(dto: {
    title: string;
    categoryId: string;
    price?: number;
    promotionalPrice?: number;
    costPrice?: number;
    stock?: number;
    isVisible?: boolean;
    isBestSeller?: boolean;
  }) {
    const categoryExists = await this.productsRepository.checkCategoryExists(
      dto.categoryId,
    );
    if (!categoryExists) {
      throw new BadRequestException('Categoria não encontrada');
    }

    return this.productsRepository.create(dto);
  }
}
