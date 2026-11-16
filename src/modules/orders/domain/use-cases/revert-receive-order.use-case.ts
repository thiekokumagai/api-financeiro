import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order, PaymentStatus } from '../entities/order.entity';
import { EventsGateway } from '../../../events/events.gateway';

@Injectable()
export class RevertReceiveOrderUseCase {
  constructor(
    private readonly ordersRepository: IOrdersRepository,
    private readonly eventsGateway: EventsGateway,
  ) {}

  async execute(
    id: string,
    currentUser?: { storeId?: string | null; role?: string } | null,
  ): Promise<Order> {
    const storeFilter =
      currentUser && currentUser.role !== 'SUPER_ADMIN'
        ? currentUser.storeId ?? '__NO_STORE__'
        : undefined;

    const order = await this.ordersRepository.findById(id, storeFilter);
    if (
      !order ||
      (currentUser &&
        currentUser.role !== 'SUPER_ADMIN' &&
        (!currentUser.storeId || order.storeId !== currentUser.storeId))
    ) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    order.paymentStatus = PaymentStatus.PENDING;
    order.paymentDate = null;
    order.totalReceived = 0;
    order.receiptSurcharge = 0;
    order.receiptDiscount = 0;
    order.paymentDiscount = 0;
    order.installmentSurcharge = 0;
    order.cardFee = 0;

    const savedOrder = await this.ordersRepository.save(order);
    this.eventsGateway.notifyOrderUpdated(savedOrder);
    return savedOrder;
  }
}
