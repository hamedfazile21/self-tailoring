"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("../customers/entities/customer.entity");
const measurement_entity_1 = require("../measurements/entities/measurement.entity");
const order_entity_1 = require("../orders/entities/order.entity");
let DashboardService = class DashboardService {
    customerRepository;
    measurementRepository;
    orderRepository;
    constructor(customerRepository, measurementRepository, orderRepository) {
        this.customerRepository = customerRepository;
        this.measurementRepository = measurementRepository;
        this.orderRepository = orderRepository;
    }
    async totals() {
        const [customers, measurements, orders] = await Promise.all([
            this.customerRepository.count(),
            this.measurementRepository.count(),
            this.orderRepository.count(),
        ]);
        return {
            customers,
            measurements,
            orders,
        };
    }
    async monthlyOrders(year) {
        const targetYear = Number.isInteger(Number(year)) && Number(year) > 0
            ? Number(year)
            : new Date().getFullYear();
        const rows = await this.orderRepository
            .createQueryBuilder('order')
            .select('MONTH(order.start_date)', 'month')
            .addSelect('COUNT(order.id)', 'orders')
            .addSelect('SUM(order.price)', 'total')
            .where('YEAR(order.start_date) = :targetYear', { targetYear })
            .groupBy('MONTH(order.start_date)')
            .orderBy('MONTH(order.start_date)', 'ASC')
            .getRawMany();
        const byMonth = new Map(rows.map((row) => [Number(row.month), row]));
        const months = Array.from({ length: 12 }, (_, index) => {
            const month = index + 1;
            const row = byMonth.get(month);
            return {
                month,
                label: new Date(targetYear, index, 1).toLocaleString('en-US', {
                    month: 'short',
                }),
                orders: row ? Number(row.orders) : 0,
                total: row ? Number(row.total ?? 0) : 0,
            };
        });
        return {
            year: targetYear,
            months,
            orders: months.reduce((sum, month) => sum + month.orders, 0),
            total: months.reduce((sum, month) => sum + month.total, 0),
        };
    }
    async pendingOrders(page = 1, limit = 4) {
        const currentPage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
        const pageSize = Number.isInteger(Number(limit)) && Number(limit) > 0
            ? Math.min(Number(limit), 100)
            : 4;
        const [data, total] = await this.orderRepository.findAndCount({
            where: { status: 'pending' },
            relations: { customer: true, measurement: true },
            order: { end_date: 'ASC', id: 'DESC' },
            skip: (currentPage - 1) * pageSize,
            take: pageSize,
        });
        return {
            data,
            pagination: {
                page: currentPage,
                limit: pageSize,
                total,
                totalPages: Math.ceil(total / pageSize),
            },
        };
    }
    async topCustomers(limit = 5) {
        const pageSize = Number.isInteger(Number(limit)) && Number(limit) > 0
            ? Math.min(Number(limit), 100)
            : 5;
        const rows = await this.orderRepository
            .createQueryBuilder('order')
            .innerJoin('order.customer', 'customer')
            .select('customer.id', 'id')
            .addSelect('customer.name', 'name')
            .addSelect('customer.last_name', 'last_name')
            .addSelect('customer.phone', 'phone')
            .addSelect('COUNT(order.id)', 'orders')
            .addSelect('SUM(order.price)', 'total')
            .groupBy('customer.id')
            .addGroupBy('customer.name')
            .addGroupBy('customer.last_name')
            .addGroupBy('customer.phone')
            .orderBy('total', 'ASC')
            .addOrderBy('customer.id', 'ASC')
            .limit(pageSize)
            .getRawMany();
        return rows.map((row) => ({
            id: Number(row.id),
            name: row.name,
            last_name: row.last_name,
            phone: row.phone,
            orders: Number(row.orders),
            total: Number(row.total ?? 0),
        }));
    }
};
exports.DashboardService = DashboardService;
exports.DashboardService = DashboardService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __param(1, (0, typeorm_1.InjectRepository)(measurement_entity_1.Measurement)),
    __param(2, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], DashboardService);
//# sourceMappingURL=dashboard.service.js.map