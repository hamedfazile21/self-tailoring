import { HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entities/customer.entity';
import { LoggedUser } from 'src/interface/global.interface';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly repository: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const customer = this.repository.create({
      ...createCustomerDto,
    });
    return this.repository.save(customer);
  }

  async findAll() {
    return this.repository.find();
  }

  async findOne(id: number) {
    const customer = await this.repository.findOne({
      where: { id: id },
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
