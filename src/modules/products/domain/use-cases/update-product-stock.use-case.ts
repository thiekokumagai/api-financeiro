import { Injectable } from '@nestjs/common';
import { IProductsRepository } from '../repositories/iproducts.repository';
import { UpdateProductStockDto } from '../../infrastructure/dtos/update-product-stock.dto';

@Injectable()
export class UpdateProductStockUseCase {
  constructor(private readonly productsRepository: IProductsRepository) {}

  async execute(productId: string, dto: UpdateProductStockDto) {
    return this.productsRepository.updateStock(
      productId,
      dto.type,
      dto.quantity,
      dto.observation,
    );
  }
}
