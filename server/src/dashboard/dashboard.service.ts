import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from 'src/customers/entities/customer.entity';
import { Measurement } from 'src/measurements/entities/measurement.entity';
import { Order } from 'src/orders/entities/order.entity';

interface MonthlyOrdersRow {
  month: number;
  orders: string;
  total: string | null;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Measurement)
    private readonly measurementRepository: Repository<Measurement>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async totals() {
    const [customers, measurements, orders] = await Promise.all([
      this.customerRepository.count(),
      this.measurementRepository.count(),
      this.orderRepository.count(),
    ]);

    return {
      customers,
      measurements,
      orders,
    };
  }

  async monthlyOrders(year?: number) {
    const targetYear =
      Number.isInteger(Number(year)) && Number(year) > 0
        ? Number(year)
        : new Date().getFullYear();

    // `price` is the order total, so summing the column is enough. The chart
    // needs every month present, so the grouped rows are merged into a full
    // twelve-month skeleton below.
    const rows: MonthlyOrdersRow[] = await this.orderRepository
      .createQueryBuilder('order')
      .select('MONTH(order.start_date)', 'month')
      .addSelect('COUNT(order.id)', 'orders')
      .addSelect('SUM(order.price)', 'total')
      .where('YEAR(order.start_date) = :targetYear', { targetYear })
      .groupBy('MONTH(order.start_date)')
      .orderBy('MONTH(order.start_date)', 'ASC')
      .getRawMany();

    const byMonth = new Map(rows.map((row) => [Number(row.month), row]));
    const months = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const row = byMonth.get(month);
      return {
        month,
        label: new Date(targetYear, index, 1).toLocaleString('en-US', {
          month: 'short',
        }),
        orders: row ? Number(row.orders) : 0,
        total: row ? Number(row.total ?? 0) : 0,
      };
    });

    return {
      year: targetYear,
      months,
      orders: months.reduce((sum, month) => sum + month.orders, 0),
      total: months.reduce((sum, month) => sum + month.total, 0),
    };
  }

  async pendingOrders(limit = 5) {
    const pageSize =
      Number.isInteger(Number(limit)) && Number(limit) > 0
        ? Math.min(Number(limit), 100)
        : 5;

    // `total` counts every pending order, not just the page, so the dashboard
    // can show "5 of 23 pending".
    const [data, total] = await this.orderRepository.findAndCount({
      where: { status: 'pending' },
      relations: { customer: true, measurement: true },
      order: { end_date: 'ASC', id: 'DESC' },
      take: pageSize,
    });

    return {
      data,
      pagination: {
        page: 1,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}
