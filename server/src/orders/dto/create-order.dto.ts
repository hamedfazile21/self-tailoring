import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateOrderDto {
  @IsInt()
  @Min(1)
  customer_id!: number;

  @IsInt()
  @Min(1)
  measurement_id!: number;

  @IsDateString()
  start_date!: string;

  @IsDateString()
  end_date!: string;

  @IsString()
  @IsNotEmpty()
  collar_type!: string;

  @IsString()
  @IsNotEmpty()
  pants_type!: string;

  @IsString()
  @IsNotEmpty()
  sleeve_type!: string;

  @IsBoolean()
  chest_pocket!: boolean;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;
}
