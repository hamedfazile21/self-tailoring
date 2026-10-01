import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { Customer } from 'src/customers/entities/customer.entity';
import { Measurement } from 'src/measurements/entities/measurement.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Customer, Measurement])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
