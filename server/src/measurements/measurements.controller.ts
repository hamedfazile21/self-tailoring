import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { MeasurementsService } from './measurements.service';
import { CreateMeasurementDto } from './dto/create-measurement.dto';
import { UpdateMeasurementDto } from './dto/update-measurement.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('measurements')
export class MeasurementsController {
  constructor(private readonly measurementsService: MeasurementsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('/create')
  create(@Body() createMeasurementDto: CreateMeasurementDto) {
    return this.measurementsService.create(createMeasurementDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.measurementsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('/show/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.measurementsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/customer_show/:customerId')
  findByCustomer(@Param('customerId', ParseIntPipe) customerId: number) {
    return this.measurementsService.findByCustomer(customerId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('/update/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMeasurementDto: UpdateMeasurementDto,
  ) {
    return this.measurementsService.update(id, updateMeasurementDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete/:id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.measurementsService.remove(id);
  }
}
