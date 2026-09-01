import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from '../prisma/prisma.module';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { SettingsModule } from './modules/settings/settings.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CashRegistersModule } from './modules/cash-registers/cash-registers.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { FixedCostsModule } from './modules/fixed-costs/fixed-costs.module';
import { InvestmentsModule } from './modules/investments/investments.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { CustomersModule } from './modules/customers/customers.module';
import { EventsModule } from './modules/events/events.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { StoresModule } from './modules/stores/stores.module';
import { ScheduleModule } from '@nestjs/schedule';
import { BillingModule } from './modules/billing/billing.module';



@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/public',
    }),

    TenantModule,
    StoresModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    SettingsModule,
    OrdersModule,
    CashRegistersModule,
    CouponsModule,
    FixedCostsModule,
    InvestmentsModule,
    DashboardModule,
    CustomersModule,
    EventsModule,
    AnalyticsModule,
    BillingModule,
  ],
})
export class AppModule {}
