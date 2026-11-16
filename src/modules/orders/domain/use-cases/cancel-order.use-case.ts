import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { IOrdersRepository } from '../repositories/iorders.repository';
import { Order } from '../entities/order.entity';
import { EventsGateway } from '../../../events/events.gateway';

@Injectable()
export class CancelOrderUseCase {
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

    try {
      const canceledOrder = await this.ordersRepository.cancelAndRestoreStock(id);
      
      // Notify client front to update catalog since stock changed
      this.eventsGateway.server.emit('products.refresh');
      this.eventsGateway.notifyOrderUpdated(canceledOrder);
      
      return canceledOrder;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
