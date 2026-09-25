import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../../../../prisma/prisma.service';
import { ComputeStockIntelligenceUseCase } from '../../domain/use-cases/compute-stock-intelligence.use-case';

@Injectable()
export class StockIntelligenceCronService {
  private readonly logger = new Logger(StockIntelligenceCronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly computeStockIntelligenceUseCase: ComputeStockIntelligenceUseCase,
  ) {}

  // Cálculo analítico de estoque e saídas (04:00 AM)
  @Cron(CronExpression.EVERY_DAY_AT_4AM, { timeZone: 'America/Sao_Paulo' })
  async handleNightlyComputation() {
    this.logger.log('Disparando cron de inteligência de estoque (04:00)...');
    try {
      await this.computeStockIntelligenceUseCase.execute();
    } catch (error) {
      this.logger.error('Erro no cron de inteligência de estoque:', error);
    }
  }

  // Digest matinal de estoque crítico e sem giro (10:00 AM)
  @Cron('0 0 10 * * *', { timeZone: 'America/Sao_Paulo' })
  async handleMorningDigest() {
    this.logger.log('Executando inteligência de estoque matinal...');
    try {
      await this.computeStockIntelligenceUseCase.execute();
    } catch (error) {
      this.logger.error('Erro ao executar inteligência de estoque matinal:', error);
    }
  }
}
