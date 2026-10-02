import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(createCustomerDto: CreateCustomerDto): Promise<import("./entities/customer.entity").Customer>;
    findAll(page?: string, limit?: string, search?: string): Promise<{
        data: import("./entities/customer.entity").Customer[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<import("./entities/customer.entity").Customer>;
    update(id: number, updateCustomerDto: UpdateCustomerDto): Promise<import("./entities/customer.entity").Customer>;
    remove(ids: number[]): Promise<{
        message: string;
        affected: number;
    }>;
}
