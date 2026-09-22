import {
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { UpdateMeasurementDto } from './dto/update-measurement.dto';
import { Repository } from 'typeorm';
import { Measurement } from './entities/measurement.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CustomersService } from 'src/customers/customers.service';

@Injectable()
export class MeasurementsService {
  constructor(
    @Inject(forwardRef(() => CustomersService))
    private readonly customersService: CustomersService,

    @InjectRepository(Measurement)
    private readonly repository: Repository<Measurement>,
  ) {}

  async create(createMeasurementDto: CreateMeasurementDto) {
    const { customer_id, ...measurementData } = createMeasurementDto;

    const customer = await this.customersService.findOne(customer_id);

    const newRecode = this.repository.create({
      ...measurementData,
      customer,
    });
    await this.repository.save(newRecode);
    return createMeasurementDto;
  }

  async findAll() {
    return await this.repository.find();
  }

  async findOne(id: number) {
    const findRow = await this.repository.findOne({ where: { id } });
    if (!findRow) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        data: ['Measurement Not Found'],
      });
    }
    return findRow;
  }

  async update(id: number, updateMeasurementDto: UpdateMeasurementDto) {
    const { customer_id, ...rest } = updateMeasurementDto;

    await this.customersService.findOne(customer_id || 0);

    await this.findOne(id);

    await this.repository.update(id, rest);

    return this.findOne(id);
  }

  async remove(id: number) {
    const currentRow = await this.repository.delete(id);

    if (currentRow.affected === 0) {
      throw new NotFoundException({
        status: HttpStatus.NOT_FOUND,
        data: ['Customer Not Found'],
      });
    }

    return ['measurement deleted successfully'];
  }
}
