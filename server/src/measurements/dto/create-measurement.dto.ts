import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateMeasurementDto {
  @IsNotEmpty()
  @IsNumber()
  customer_id!: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsNotEmpty()
  @IsNumber()
  length!: number;

  @IsNotEmpty()
  @IsNumber()
  shoulder!: number;

  @IsNotEmpty()
  @IsNumber()
  sleeve_length!: number;

  @IsOptional()
  @IsNumber()
  collar!: number;

  @IsNotEmpty()
  @IsNumber()
  chest!: number;

  @IsOptional()
  @IsNumber()
  hem!: number;

  @IsNotEmpty()
  @IsNumber()
  cuff!: number;

  @IsNotEmpty()
  @IsNumber()
  pants_length!: number;
}
