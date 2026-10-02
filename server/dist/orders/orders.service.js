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
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const order_entity_1 = require("./entities/order.entity");
const typeorm_2 = require("@nestjs/typeorm");
const customer_entity_1 = require("../customers/entities/customer.entity");
const measurement_entity_1 = require("../measurements/entities/measurement.entity");
let OrdersService = class OrdersService {
    orderRepository;
    customerRepository;
    measurementRepository;
    constructor(orderRepository, customerRepository, measurementRepository) {
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.measurementRepository = measurementRepository;
    }
    async create(createOrderDto) {
        const [customer, measurement] = await Promise.all([
            this.customerRepository.findOneBy({ id: createOrderDto.customer_id }),
            this.measurementRepository.findOne({
                where: { id: createOrderDto.measurement_id },
                relations: { customer: true },
            }),
        ]);
        if (!customer) {
            throw new common_1.NotFoundException(`Customer with id ${createOrderDto.customer_id} not found`);
        }
        if (!measurement) {
            throw new common_1.NotFoundException(`Measurement with id ${createOrderDto.measurement_id} not found`);
        }
        if (measurement.customer.id !== customer.id) {
            throw new common_1.BadRequestException(`Measurement with id ${measurement.id} does not belong to customer with id ${customer.id}`);
        }
        const { customer_id: _customerId, measurement_id: _measurementId, ...orderData } = createOrderDto;
        const order = this.orderRepository.create({
            ...orderData,
            status: orderData.status ?? 'pending',
            customer,
            measurement,
        });
        const savedOrder = await this.orderRepository.save(order);
        return this.findOne(savedOrder.id);
    }
    async findAll(page = 1, limit = 10, search = '') {
        const currentPage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
        const pageSize = Number.isInteger(Number(limit)) && Number(limit) > 0
            ? Math.min(Number(limit), 100)
            : 10;
        const normalizedSearch = search.trim();
        const where = normalizedSearch
            ? [
                { customer: { name: (0, typeorm_1.Like)(`%${normalizedSearch}%`) } },
                { customer: { phone: (0, typeorm_1.Like)(`%${normalizedSearch}%`) } },
                { start_date: (0, typeorm_1.Like)(`%${normalizedSearch}%`) },
                { end_date: (0, typeorm_1.Like)(`%${normalizedSearch}%`) },
            ]
            : undefined;
        const [data, total] = await this.orderRepository.findAndCount({
            where,
            relations: { customer: true, measurement: true },
            order: { id: 'DESC' },
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
    async findOne(id) {
        const findOrder = await this.orderRepository.findOne({
            where: { id },
            relations: { customer: true, measurement: true },
        });
        if (!findOrder) {
            throw new common_1.NotFoundException({ message: `Order with id ${id} not found` });
        }
        return findOrder;
    }
    async update(id, updateOrderDto) {
        const order = await this.findOne(id);
        const customerId = updateOrderDto.customer_id ?? order.customer.id;
        const measurementId = updateOrderDto.measurement_id ?? order.measurement.id;
        const [customer, measurement] = await Promise.all([
            this.customerRepository.findOneBy({ id: customerId }),
            this.measurementRepository.findOne({
                where: { id: measurementId },
                relations: { customer: true },
            }),
        ]);
        if (!customer) {
            throw new common_1.NotFoundException(`Customer with id ${customerId} not found`);
        }
        if (!measurement) {
            throw new common_1.NotFoundException(`Measurement with id ${measurementId} not found`);
        }
        if (measurement.customer.id !== customer.id) {
            throw new common_1.BadRequestException(`Measurement with id ${measurement.id} does not belong to customer with id ${customer.id}`);
        }
        const { customer_id: _customerId, measurement_id: _measurementId, ...orderData } = updateOrderDto;
        Object.assign(order, orderData, { customer, measurement });
        await this.orderRepository.save(order);
        return this.findOne(id);
    }
    async remove(ids) {
        if (!Array.isArray(ids) ||
            ids.length === 0 ||
            ids.some((id) => !Number.isInteger(id) || id <= 0)) {
            throw new common_1.BadRequestException('A non-empty array of valid order ids is required');
        }
        const result = await this.orderRepository.delete(ids);
        return {
            message: 'Orders deleted successfully',
            affected: result.affected ?? 0,
        };
    }
    async done(id) {
        const order = await this.findOne(id);
        if (!order) {
            throw new common_1.NotFoundException({ message: `Order with id ${id} not found` });
        }
        order.status = 'done';
        await this.orderRepository.save(order);
        return this.findOne(id);
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_2.InjectRepository)(customer_entity_1.Customer)),
    __param(2, (0, typeorm_2.InjectRepository)(measurement_entity_1.Measurement)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository])
], OrdersService);
//# sourceMappingURL=orders.service.js.map