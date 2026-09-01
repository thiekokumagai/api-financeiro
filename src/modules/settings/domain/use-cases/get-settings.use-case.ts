import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { StoreSettings } from '../entities/store-settings.entity';
import { ISettingsRepository } from '../repositories/isettings.repository';
import { TenantContextService } from '../../../tenant/tenant-context.service';

@Injectable()
export class GetSettingsUseCase {
  constructor(
    private readonly settingsRepository: ISettingsRepository,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async execute(): Promise<StoreSettings> {
    const isActive = this.tenantContextService.getIsActive();
    if (isActive === false) {
      throw new ForbiddenException('STORE_OFFLINE');
    }

    const settings = await this.settingsRepository.get();
    if (!settings) {
      throw new NotFoundException('Configurações da loja não encontradas');
    }
    return settings;
  }
}
