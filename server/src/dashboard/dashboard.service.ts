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

interface TopCustomerRow {
  id: number;
  name: string;
  last_name: string | null;
  phone: string;
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

  async pendingOrders(page = 1, limit = 4) {
    const currentPage =
      Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const pageSize =
      Number.isInteger(Number(limit)) && Number(limit) > 0
        ? Math.min(Number(limit), 100)
        : 4;

    // `total` counts every pending order, not just this page, so the dashboard
    // can drive a pager off it.
    const [data, total] = await this.orderRepository.findAndCount({
      where: { status: 'pending' },
      relations: { customer: true, measurement: true },
      order: { end_date: 'ASC', id: 'DESC' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    });

    return {
      data,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async topCustomers(limit = 5) {
    const pageSize =
      Number.isInteger(Number(limit)) && Number(limit) > 0
        ? Math.min(Number(limit), 100)
        : 5;

    // An inner join, so a customer who has never ordered is simply absent
    // rather than showing up with a total of zero. Every selected column is in
    // the GROUP BY, which keeps the query valid under ONLY_FULL_GROUP_BY
    // instead of relying on functional-dependency detection.
    const rows: TopCustomerRow[] = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.customer', 'customer')
      .select('customer.id', 'id')
      .addSelect('customer.name', 'name')
      .addSelect('customer.last_name', 'last_name')
      .addSelect('customer.phone', 'phone')
      .addSelect('COUNT(order.id)', 'orders')
      .addSelect('SUM(order.price)', 'total')
      .groupBy('customer.id')
      .addGroupBy('customer.name')
      .addGroupBy('customer.last_name')
      .addGroupBy('customer.phone')
      .orderBy('total', 'ASC')
      // Ties on total would otherwise come back in an arbitrary order, which
      // makes the list jump between identical requests.
      .addOrderBy('customer.id', 'ASC')
      .limit(pageSize)
      .getRawMany();

    return rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      last_name: row.last_name,
      phone: row.phone,
      orders: Number(row.orders),
      total: Number(row.total ?? 0),
    }));
  }
}
