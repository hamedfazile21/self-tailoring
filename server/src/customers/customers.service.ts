import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { LoggedUser } from 'src/interface/global.interface';
import { MeasurementsService } from 'src/measurements/measurements.service';

@Injectable()
export class CustomersService {
  constructor(
    @Inject(forwardRef(() => MeasurementsService))
    private readonly measurementsService: MeasurementsService,

    @InjectRepository(Customer)
    private readonly repository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const { measurement, ...customerData } = createCustomerDto;
    const customer = this.repository.create(customerData);
    const savedCustomer = await this.repository.save(customer);

    if (measurement) {
      await this.measurementsService.create({
        ...measurement,
        customer_id: savedCustomer.id,
      });
    }

    return this.findOne(savedCustomer.id);
  }

  async findAll() {
    return this.repository.find({ relations: { measurements: true } });
  }

  async findOne(id: number) {
    const customer = await this.repository.findOne({
      where: { id: id },
      relations: { measurements: true },
    });
    if (!customer)
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        data: ['Customer Not Found'],
      });
    return customer;
  }

  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const customer = await this.findOne(id);
    Object.assign(customer, updateCustomerDto as Partial<Customer>);
    return this.repository.save(customer);
  }

  async remove(id: number) {
    const deleteRow = await this.repository.delete({ id });
    if (deleteRow.affected === 0) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        data: ['Customer Not Found'],
      });
    }
    return ['customer deleted successfully'];
  }
}
