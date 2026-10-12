import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { MeasurementsService } from "../measurements/measurements.service";
export declare class CustomersService {
    private readonly measurementsService;
    private readonly repository;
    constructor(measurementsService: MeasurementsService, repository: Repository<Customer>);
    create(createCustomerDto: CreateCustomerDto): Promise<Customer>;
    private parseStatusFilter;
    findAll(page?: number, limit?: number, search?: string, status?: string): Promise<{
        data: Customer[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    private sortMeasurements;
    findOne(id: number): Promise<Customer>;
    update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<Customer>;
    private reconcileMeasurements;
    remove(ids: number[]): Promise<{
        message: string;
        affected: number;
    }>;
}
