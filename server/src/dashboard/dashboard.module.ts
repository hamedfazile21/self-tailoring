import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Customer } from 'src/customers/entities/customer.entity';
import { Measurement } from 'src/measurements/entities/measurement.entity';
import { Order } from 'src/orders/entities/order.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Measurement, Order])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
