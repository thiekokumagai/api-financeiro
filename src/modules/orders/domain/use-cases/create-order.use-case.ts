import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order } from '../entities/order.entity';
import { ValidateCouponUseCase } from '../../../coupons/domain/use-cases/validate-coupon.use-case';
import type { ICouponsRepository } from '../../../coupons/domain/repositories/icoupons.repository';
import { PushNotificationService } from '../../../../shared/services/push-notification.service';
import { IUsersRepository } from '../../../users/domain/repositories/iusers.repository';
import { PrintGateway } from '../../../print/print.gateway';
import { EventsGateway } from '../../../events/events.gateway';
import { TenantContextService } from '../../../tenant/tenant-context.service';

@Injectable()
export class CreateOrderUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly validateCouponUseCase: ValidateCouponUseCase,
    @Inject('ICouponsRepository')
    private readonly couponsRepository: ICouponsRepository,
    private readonly pushNotificationService: PushNotificationService,
    private readonly usersRepository: IUsersRepository,
    private readonly printGateway: PrintGateway,
    private readonly eventsGateway: EventsGateway,
    private readonly tenantContextService: TenantContextService,
  ) {}

  async execute(
    data: Partial<Order> & { couponTitle?: string; showProductPrices?: boolean },
  ): Promise<Order> {
    try {
      let couponId: string | undefined = undefined;
      let couponDiscountValue = Number(data.couponDiscount) || 0;

      const storeId = data.storeId || this.tenantContextService.getStoreId() || undefined;

      if (data.couponTitle) {
        let nonPromoTotal = (data as any).nonPromoItemsTotal !== undefined 
          ? Number((data as any).nonPromoItemsTotal) 
          : undefined;

        if (nonPromoTotal === undefined && data.items && Array.isArray(data.items)) {
          nonPromoTotal = data.items.reduce((acc: number, item: any) => {
            const isPromo = item.isPromo || item.isPromotional || (item.oldPrice !== undefined && item.oldPrice > 0);
            if (isPromo) return acc;
            return acc + (Number(item.price) || 0) * (Number(item.quantity) || 1);
          }, 0);
        }

        const { coupon, discountAmount } =
          await this.validateCouponUseCase.execute({
            title: data.couponTitle,
            orderTotal: Number(data.itemsTotal) || 0,
            nonPromoItemsTotal: nonPromoTotal,
          });

        couponId = coupon.id;
        couponDiscountValue = discountAmount;
      }

      const order = new Order({
        ...data,
        storeId: storeId || data.storeId,
        couponDiscount: couponDiscountValue,
        couponId: couponId,
        status: data.status || undefined,
        paymentDate: data.paymentStatus === 'PAID' ? new Date() : undefined,
      });

      const itemsTotal = Number(order.itemsTotal) || 0;
      const installmentSurcharge = Number(order.installmentSurcharge) || 0;
      const receiptSurcharge = Number(order.receiptSurcharge) || 0;
      const paymentDiscount = Number(order.paymentDiscount) || 0;
      const receiptDiscount = Number(order.receiptDiscount) || 0;
      const cDiscount = Number(order.couponDiscount) || 0;

      const calculatedTotal =
        Math.round(
          (itemsTotal +
            installmentSurcharge +
            receiptSurcharge -
            paymentDiscount -
            receiptDiscount -
            cDiscount) *
            100,
        ) / 100;
        
      order.totalOrder = data.totalOrder !== undefined ? data.totalOrder : calculatedTotal;
      const savedOrder =
        await this.ordersRepository.saveWithStockDecrement(order);

      if (couponId) {
        const coupon = await this.couponsRepository.findById(couponId);
        if (coupon) {
          await this.couponsRepository.update(couponId, {
            currentUses: coupon.currentUses + 1,
          });
        }
      }

      // Disparar Notificação Push
      try {
        const admins = await this.usersRepository.findAll();
        const tokens: string[] = [];
        const webSubscriptions: any[] = [];
        admins.forEach(u => {
          if (u.expoPushToken) {
            tokens.push(...u.expoPushToken.split(',').filter(Boolean));
          }
          if (u.webPushSubscription) {
            if (Array.isArray(u.webPushSubscription)) {
              webSubscriptions.push(...u.webPushSubscription);
            } else {
              webSubscriptions.push(u.webPushSubscription as any);
            }
          }
        });
        if (tokens.length > 0 || webSubscriptions.length > 0) {
          const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
          const formattedValue = formatter.format(Number(savedOrder.totalOrder || 0));
          this.pushNotificationService.sendNotifications(
            tokens,
            `(${formattedValue}) Oba! Chegou pedido 🤩`,
            `Pedido nº #${savedOrder.orderNumber} - ${savedOrder.customerName}`,
            { orderId: savedOrder.id },
            webSubscriptions
          ).catch(e => console.error(e));
        }
      } catch (err) {
        console.error('Erro ao buscar tokens para notificação', err);
      }

      // Disparar WebSocket para impressão
      try {
        if (savedOrder.status !== 'CANCELLED') {
          const orderForPrint = { ...savedOrder, showProductPrices: data.showProductPrices };
          const targetPrintStoreId = savedOrder.storeId || storeId || '1';
          this.printGateway.emitNovoPedido(targetPrintStoreId, orderForPrint);
        }
      } catch (err) {
        console.error('Erro ao emitir pedido para impressão', err);
      }

      // Disparar Eventos WebSocket
      try {
        this.eventsGateway.notifyNewOrder(savedOrder);
        this.eventsGateway.server.emit('products.refresh');
      } catch (err) {
        console.error('Erro ao emitir eventos websocket', err);
      }

      return savedOrder;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
