import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ProductsRankingCronService {
  private readonly logger = new Logger(ProductsRankingCronService.name);

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async updateBestSellers() {
    // Cron desativado (campo isBestSeller removido)
  }
}
