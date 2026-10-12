import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
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
] as const) {
  /**
   * Set on a row that already exists, so `update` can tell an edit from an
   * addition. Left off by `create`, and ignored there — the ids come from the
   * inserts.
   */
  @IsOptional()
  @IsInt()
  @IsPositive()
  id?: number;
}

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
   * The customer's measurements, written on the same request as the customer.
   *
   * `@ValidateNested({ each: true })` and `@Type()` have to come as a pair:
   * without them class-validator walks straight past the nested objects and
   * anything at all reaches the measurements rows.
   *
   * `UpdateCustomerDto` is a `PartialType` of this class and inherits both, so
   * on a PATCH the property stays optional while each object in it stays whole
   * — every row sent carries every field a measurement requires.
   *
   * On a PATCH the array is the customer's whole set: rows with an `id` are
   * updated, rows without are added, and rows the array leaves out are
   * deleted. Leaving the property off entirely changes nothing.
   */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CustomerMeasurementDto)
  measurements?: CustomerMeasurementDto[];
}
