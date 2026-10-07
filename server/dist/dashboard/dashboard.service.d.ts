import { Repository } from 'typeorm';
import { Customer } from "../customers/entities/customer.entity";
import { Measurement } from "../measurements/entities/measurement.entity";
import { Order } from "../orders/entities/order.entity";
export declare class DashboardService {
    private readonly customerRepository;
    private readonly measurementRepository;
    private readonly orderRepository;
    constructor(customerRepository: Repository<Customer>, measurementRepository: Repository<Measurement>, orderRepository: Repository<Order>);
    totals(): Promise<{
        customers: number;
        measurements: number;
        orders: number;
    }>;
    monthlyOrders(year?: number): Promise<{
        year: number;
        months: {
            month: number;
            label: string;
            orders: number;
            total: number;
        }[];
        orders: number;
        total: number;
    }>;
    pendingOrders(page?: number, limit?: number): Promise<{
        data: Order[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    topCustomers(limit?: number): Promise<{
        id: number;
        name: string;
        last_name: string | null;
        phone: string;
        orders: number;
        total: number;
    }[]>;
}
