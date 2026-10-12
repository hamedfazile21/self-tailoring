import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
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

  /**
   * The customer's measurement, written on the same request as the customer.
   *
   * `@ValidateNested()` and `@Type()` have to come as a pair: without them
   * class-validator walks straight past the nested object and anything at all
   * reaches the measurements row.
   *
   * `UpdateCustomerDto` is a `PartialType` of this class and inherits both, so
   * on a PATCH the property stays optional while the object itself stays
   * whole — sending a measurement means sending every field a measurement
   * requires, and it overwrites the customer's current one.
   */
  @IsOptional()
  @ValidateNested()
  @Type(() => CustomerMeasurementDto)
  measurement?: CustomerMeasurementDto;
}
