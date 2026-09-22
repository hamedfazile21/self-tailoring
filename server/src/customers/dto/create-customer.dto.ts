import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsIn,
} from 'class-validator';
import { OmitType } from '@nestjs/mapped-types';
import { CreateMeasurementDto } from 'src/measurements/dto/create-measurement.dto';

class CustomerMeasurementDto extends OmitType(CreateMeasurementDto, [
  'customer_id',
] as const) {}

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  last_name?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(15)
  phone!: string;

  @IsNotEmpty()
  @IsIn(['active', 'inactive'])
  status?: 'active' | 'inactive';

  @IsOptional()
  measurement?: CustomerMeasurementDto;
}
