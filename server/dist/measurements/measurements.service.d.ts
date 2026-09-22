import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { UpdateMeasurementDto } from './dto/update-measurement.dto';
import { Repository } from 'typeorm';
import { Measurement } from './entities/measurement.entity';
import { CustomersService } from "../customers/customers.service";
export declare class MeasurementsService {
    private readonly customersService;
    private readonly repository;
    constructor(customersService: CustomersService, repository: Repository<Measurement>);
    create(createMeasurementDto: CreateMeasurementDto): Promise<CreateMeasurementDto>;
    findAll(): Promise<Measurement[]>;
    findOne(id: number): Promise<Measurement>;
    update(id: number, updateMeasurementDto: UpdateMeasurementDto): Promise<Measurement>;
    remove(id: number): Promise<string[]>;
}
