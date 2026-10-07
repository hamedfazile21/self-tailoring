import { DashboardService } from './dashboard.service';
export declare class DashboardController {
    private readonly dashboardService;
    constructor(dashboardService: DashboardService);
    totals(): Promise<{
        customers: number;
        measurements: number;
        orders: number;
    }>;
    monthlyOrders(year?: string): Promise<{
        year: number;
        months: {
            month: number;
            label: string;
            orders: number;
            total: number;
        }[];
        orders: number;
        total: number;
    }>;
    pendingOrders(page?: string, limit?: string): Promise<{
        data: import("../orders/entities/order.entity").Order[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    topCustomers(limit?: string): Promise<{
        id: number;
        name: string;
        last_name: string | null;
        phone: string;
        orders: number;
        total: number;
    }[]>;
}
