import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetSettingsUseCase } from '../../domain/use-cases/get-settings.use-case';
import { Public } from '../../../auth/infrastructure/decorators/public.decorator';

@ApiTags('Store Settings')
@Controller('store/settings')
export class StoreSettingsController {
  constructor(private readonly getSettingsUseCase: GetSettingsUseCase) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obter configurações públicas da loja (vitrine)' })
  @ApiResponse({ status: 200 })
  async getStoreSettings() {
    return this.getSettingsUseCase.execute();
  }

  @Get('status')
  @ApiOperation({ summary: 'Obter status atual da loja (aberta/fechada)' })
  @ApiResponse({ status: 200 })
  async getStoreStatus() {
    const settings = await this.getSettingsUseCase.execute();
    const businessHours = settings?.businessHours || [];

    if (!businessHours || businessHours.length === 0) {
      return { isOpen: false };
    }

    const nowStr = new Date().toLocaleString('en-US', {
      timeZone: 'America/Campo_Grande',
    });
    const now = new Date(nowStr);

    const dayOfWeek = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const todayRule = businessHours.find((rule: any) =>
      rule.days.includes(dayOfWeek),
    );

    let isOpen = false;
    if (todayRule && todayRule.intervals.length > 0) {
      isOpen = todayRule.intervals.some((interval: any) => {
        const [openHour, openMin] = interval.open.split(':').map(Number);
        const [closeHour, closeMin] = interval.close.split(':').map(Number);
        const openTotal = openHour * 60 + openMin;
        const closeTotal = closeHour * 60 + closeMin;
        return currentMinutes >= openTotal && currentMinutes < closeTotal;
      });
    }

    return { isOpen };
  }

  @Get('manifest.json')
  @Public()
  @ApiOperation({ summary: 'Obter manifest.json dinâmico para PWA' })
  async getManifest() {
    let settings: any = null;
    try {
      settings = await this.getSettingsUseCase.execute();
    } catch (e) {
      settings = { storeName: 'Financeiro' };
    }

    const adminFrontendUrl = (process.env.ADMIN_FRONTEND_URL || '').replace(
      /\/$/,
      '',
    );

    const icon192Src = adminFrontendUrl
      ? `${adminFrontendUrl}/favicon-192x192.png`
      : '/favicon-192x192.png';
    const icon512Src = adminFrontendUrl
      ? `${adminFrontendUrl}/favicon-512x512.png`
      : '/favicon-512x512.png';

    return {
      name: settings?.storeName || 'Financeiro',
      short_name: settings?.storeName || 'Financeiro',
      description: 'Painel Administrativo Financeiro',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: `${adminFrontendUrl}/`,
      scope: `${adminFrontendUrl}/`,
      icons: [
        {
          src: icon192Src,
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: icon512Src,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    };
  }
}
