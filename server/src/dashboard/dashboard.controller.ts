import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(JwtAuthGuard)
  @Get('totals')
  totals() {
    return this.dashboardService.totals();
  }

  @UseGuards(JwtAuthGuard)
  @Get('monthly-orders')
  monthlyOrders(@Query('year') year?: string) {
    return this.dashboardService.monthlyOrders(year ? Number(year) : undefined);
  }

  @UseGuards(JwtAuthGuard)
  @Get('pending-orders')
  pendingOrders(@Query('limit') limit?: string) {
    return this.dashboardService.pendingOrders(limit ? Number(limit) : 5);
  }
}
