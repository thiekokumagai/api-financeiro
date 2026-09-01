import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'Produto X' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'uuid-da-categoria' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ example: 49.9 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 25.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  costPrice?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
