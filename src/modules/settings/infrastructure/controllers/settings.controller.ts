import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { UpdateSettingsDto } from '../dtos/update-settings.dto';
import { GetSettingsUseCase } from '../../domain/use-cases/get-settings.use-case';
import { UpdateSettingsUseCase } from '../../domain/use-cases/update-settings.use-case';

@ApiTags('Settings')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(
    private readonly getSettingsUseCase: GetSettingsUseCase,
    private readonly updateSettingsUseCase: UpdateSettingsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Obter configurações da loja' })
  @ApiResponse({ status: 200 })
  async get() {
    return this.getSettingsUseCase.execute();
  }

  @Put()
  @ApiOperation({ summary: 'Atualizar configurações da loja' })
  @ApiResponse({ status: 200 })
  async update(@Body() dto: UpdateSettingsDto) {
    return this.updateSettingsUseCase.execute(dto);
  }
}
