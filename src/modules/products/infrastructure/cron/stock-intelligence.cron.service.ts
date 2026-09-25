import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { ComputeStockIntelligenceUseCase } from '../../domain/use-cases/compute-stock-intelligence.use-case';
import { PushNotificationService } from '../../../../shared/services/push-notification.service';

@Injectable()
export class StockIntelligenceCronService {
  private readonly logger = new Logger(StockIntelligenceCronService.name);
  private lastDigestDate: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly computeStockIntelligenceUseCase: ComputeStockIntelligenceUseCase,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  // 1. Cálculo analítico de estoque e saídas (04:00 AM)
  @Cron(CronExpression.EVERY_DAY_AT_4AM, { timeZone: 'America/Sao_Paulo' })
  async handleNightlyComputation() {
    this.logger.log('Disparando cron de inteligência de estoque (04:00)...');
    try {
      await this.computeStockIntelligenceUseCase.execute();
    } catch (error) {
      this.logger.error('Erro no cron de inteligência de estoque:', error);
    }
  }

  // 2. Digest matinal de estoque crítico e sem giro (10:00 AM)
  @Cron('0 0 10 * * *', { timeZone: 'America/Sao_Paulo' })
  async handleMorningDigest() {
    const today = new Date().toISOString().slice(0, 10);
    if (this.lastDigestDate === today) {
      this.logger.log('Digest matinal já enviado hoje.');
      return;
    }

    this.logger.log('Preparando Radar de Oportunidades e Riscos matinal (10:00)...');

    try {
      const stats = await this.computeStockIntelligenceUseCase.execute();

      if (stats.criticalCount === 0 && stats.stagnantCount === 0) {
        this.logger.log('Nenhum alerta crítico ou produto parado para notificar hoje.');
        return;
      }

      const users = await this.prisma.user.findMany();

      const webSubscriptions: unknown[] = [];
      for (const user of users) {
        if (user.webPushSubscription) {
          if (Array.isArray(user.webPushSubscription)) {
            webSubscriptions.push(...user.webPushSubscription);
          } else {
            webSubscriptions.push(user.webPushSubscription);
          }
        }
      }

      if (webSubscriptions.length === 0) {
        this.logger.log('Nenhum dispositivo cadastrado para push.');
        return;
      }

      const currencyFormatter = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
      const formattedStagnant = currencyFormatter.format(stats.stagnantCapital);

      const parts: string[] = [];
      if (stats.criticalCount > 0) {
        parts.push(`${stats.criticalCount} produto(s) críticos prestes a acabar`);
      }
      if (stats.stagnantCount > 0) {
        parts.push(`${formattedStagnant} parados sem giro (+45d)`);
      }

      const title = '💡 Radar de Estoque & Riscos';
      const body = `${parts.join(' e ')}. Acesse o painel para verificar.`;

      await this.pushNotificationService.sendNotifications(
        title,
        body,
        { url: '/dashboard' },
        webSubscriptions,
      );

      this.lastDigestDate = today;
      this.logger.log('Digest matinal enviado com sucesso.');
    } catch (error) {
      this.logger.error('Erro ao enviar digest matinal:', error);
    }
  }
}
