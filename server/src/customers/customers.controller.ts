import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    /** `active`, `inactive`, or `active,inactive`. Omit it for every customer. */
    @Query('status') status?: string,
  ) {
    return this.customersService.findAll(
      page ? Number(page) : 1,
      limit ? Number(limit) : 10,
      search ?? '',
      status ?? '',
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('show/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete')
  remove(@Body('ids') ids: number[]) {
    return this.customersService.remove(ids);
  }
}
