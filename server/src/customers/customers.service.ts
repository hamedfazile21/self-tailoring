import {
  BadRequestException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import type { FindOptionsWhere } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import {
  CUSTOMER_STATUSES,
  Customer,
  type CustomerStatus,
} from './entities/customer.entity';
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

  /**
   * `?status=active`, or `?status=active,inactive` to keep both. An empty
   * value means "no filter"; an unknown one is a client mistake, so it is
   * rejected rather than quietly returning every customer.
   */
  private parseStatusFilter(status: string): CustomerStatus[] {
    const values = status
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    const unknown = values.filter(
      (value) => !CUSTOMER_STATUSES.includes(value as CustomerStatus),
    );
    if (unknown.length > 0) {
      throw new BadRequestException(
        `Unknown status: ${unknown.join(', ')}. Expected ${CUSTOMER_STATUSES.join(' or ')}.`,
      );
    }

    return [...new Set(values as CustomerStatus[])];
  }

  async findAll(page = 1, limit = 10, search = '', status = '') {
    const currentPage =
      Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const pageSize =
      Number.isInteger(Number(limit)) && Number(limit) > 0
        ? Math.min(Number(limit), 100)
        : 10;
    const normalizedSearch = search.trim();
    const statuses = this.parseStatusFilter(status);

    // Merged into every branch of the search below, so the two conditions read
    // as `status = ? AND (name LIKE ? OR phone LIKE ?)` — spreading one object
    // is what keeps the `AND` from degrading into another `OR`.
    const statusWhere: FindOptionsWhere<Customer> =
      statuses.length === 0
        ? {}
        : { status: statuses.length === 1 ? statuses[0] : In(statuses) };

    const where: FindOptionsWhere<Customer>[] | FindOptionsWhere<Customer> =
      normalizedSearch
        ? [
            { ...statusWhere, name: Like(`%${normalizedSearch}%`) },
            { ...statusWhere, phone: Like(`%${normalizedSearch}%`) },
          ]
        : statusWhere;

    const [data, total] = await this.repository.findAndCount({
      where,
      relations: { measurements: true },
      order: { id: 'DESC' },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
    });

    data.forEach((customer) => this.sortMeasurements(customer));

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

  /**
   * A customer's newest measurement is the one the app treats as current, so
   * every read has to agree on which that is — `measurements[0]`.
   *
   * Sorted here rather than through `order`, because `findAll` pages with
   * `skip`/`take` and ordering a `OneToMany` underneath pagination is where
   * TypeORM turns awkward. One rule, applied the same way on both reads, over
   * a handful of rows.
   */
  private sortMeasurements(customer: Customer) {
    customer.measurements?.sort((a, b) => b.id - a.id);
    return customer;
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
    return this.sortMeasurements(customer);
  }

  /**
   * `measurement` is pulled out and handled on its own: it is not a column on
   * `customers`, so leaving it in the `Object.assign` below would let `save`
   * discard it without a word.
   *
   * Sending one overwrites the customer's current measurement, or creates
   * their first if they have none. Omitting it leaves their measurements
   * untouched.
   */
  async update(id: number, updateCustomerDto: UpdateCustomerDto) {
    const { measurement, ...customerData } = updateCustomerDto;

    const customer = await this.findOne(id);
    Object.assign(customer, customerData as Partial<Customer>);
    await this.repository.save(customer);

    if (measurement) {
      const current = customer.measurements?.at(0);

      if (current) {
        await this.measurementsService.update(current.id, {
          ...measurement,
          customer_id: id,
        });
      } else {
        await this.measurementsService.create({
          ...measurement,
          customer_id: id,
        });
      }
    }

    // Re-read rather than returning the entity above: it still holds the
    // relation as it looked before the write, and the client merges whatever
    // comes back straight into its row.
    return this.findOne(id);
  }

  async remove(ids: number[]) {
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      ids.some((id) => !Number.isInteger(id) || id <= 0)
    ) {
      throw new BadRequestException(
        'A non-empty array of valid customer ids is required',
      );
    }

    const deleteResult = await this.repository.delete(ids);
    if (deleteResult.affected === 0) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        data: ['Customers Not Found'],
      });
    }
    return {
      message: 'Customers deleted successfully',
      affected: deleteResult.affected ?? 0,
    };
  }
}
