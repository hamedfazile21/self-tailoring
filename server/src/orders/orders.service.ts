import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Like, Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from 'src/customers/entities/customer.entity';
import { Measurement } from 'src/measurements/entities/measurement.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Measurement)
    private readonly measurementRepository: Repository<Measurement>,
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const [customer, measurement] = await Promise.all([
      this.customerRepository.findOneBy({ id: createOrderDto.customer_id }),
      this.measurementRepository.findOne({
        where: { id: createOrderDto.measurement_id },
        relations: { customer: true },
      }),
    ]);

    if (!customer) {
      throw new NotFoundException(
        `Customer with id ${createOrderDto.customer_id} not found`,
      );
    }
    if (!measurement) {
      throw new NotFoundException(
        `Measurement with id ${createOrderDto.measurement_id} not found`,
      );
    }
    if (measurement.customer.id !== customer.id) {
      throw new BadRequestException(
        `Measurement with id ${measurement.id} does not belong to customer with id ${customer.id}`,
      );
    }

    const {
      customer_id: _customerId,
      measurement_id: _measurementId,
      ...orderData
    } = createOrderDto;
    const order = this.orderRepository.create({
      ...orderData,
      customer,
      measurement,
    });
    const savedOrder = await this.orderRepository.save(order);
    return this.findOne(savedOrder.id);
  }

  async findAll(page = 1, limit = 10, search = '') {
    const currentPage =
      Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const pageSize =
      Number.isInteger(Number(limit)) && Number(limit) > 0
        ? Math.min(Number(limit), 100)
        : 10;
    const normalizedSearch = search.trim();
    const where = normalizedSearch
      ? [
          { customer: { name: Like(`%${normalizedSearch}%`) } },
          { customer: { phone: Like(`%${normalizedSearch}%`) } },
          { start_date: Like(`%${normalizedSearch}%`) },
          { end_date: Like(`%${normalizedSearch}%`) },
        ]
      : undefined;
    const [data, total] = await this.orderRepository.findAndCount({
      where,
      relations: { customer: true, measurement: true },
      order: { id: 'DESC' },
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

  async findOne(id: number) {
    const findOrder = await this.orderRepository.findOne({
      where: { id },
      relations: { customer: true, measurement: true },
    });
    if (!findOrder) {
      throw new NotFoundException({ message: `Order with id ${id} not found` });
    }
    return findOrder;
  }

  async update(id: number, updateOrderDto: UpdateOrderDto) {
    return `This action updates a #${id} order`;
  }

  async remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
