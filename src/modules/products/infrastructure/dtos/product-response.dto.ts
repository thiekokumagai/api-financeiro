import { ApiProperty } from '@nestjs/swagger';

class CategoryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;
}

export class ProductResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ type: CategoryDto })
  category: CategoryDto;

  @ApiProperty({ required: false, nullable: true, example: '49.90' })
  price?: string | number | null;

  @ApiProperty({ required: false, nullable: true, example: '39.90' })
  promotionalPrice?: string | number | null;

  @ApiProperty({ required: false, nullable: true, example: '25.00' })
  costPrice?: string | number | null;

  @ApiProperty({ example: 10 })
  stock: number;

  @ApiProperty({ required: false, nullable: true })
  isVisible?: boolean;

  @ApiProperty({ required: false, nullable: true })
  isBestSeller?: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
