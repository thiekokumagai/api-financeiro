import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export enum StockMovementTypeDto {
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  SET = 'SET',
}

export class UpdateProductStockDto {
  @ApiProperty({ enum: StockMovementTypeDto, example: 'ADD' })
  @IsEnum(StockMovementTypeDto)
  type: StockMovementTypeDto;

  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiPropertyOptional({ example: 'Ajuste manual de estoque' })
  @IsOptional()
  @IsString()
  observation?: string;
}
