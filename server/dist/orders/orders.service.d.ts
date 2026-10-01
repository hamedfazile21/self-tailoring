import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { Customer } from "../customers/entities/customer.entity";
import { Measurement } from "../measurements/entities/measurement.entity";
export declare class OrdersService {
    private readonly orderRepository;
    private readonly customerRepository;
    private readonly measurementRepository;
    constructor(orderRepository: Repository<Order>, customerRepository: Repository<Customer>, measurementRepository: Repository<Measurement>);
    create(createOrderDto: CreateOrderDto): Promise<Order>;
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: Order[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<Order>;
    update(id: number, updateOrderDto: UpdateOrderDto): Promise<Order>;
    remove(id: number): Promise<string[]>;
}
