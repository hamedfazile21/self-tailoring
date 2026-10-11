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
exports.CustomersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const customer_entity_1 = require("./entities/customer.entity");
const measurements_service_1 = require("../measurements/measurements.service");
let CustomersService = class CustomersService {
    measurementsService;
    repository;
    constructor(measurementsService, repository) {
        this.measurementsService = measurementsService;
        this.repository = repository;
    }
    async create(createCustomerDto) {
        const { measurement, ...customerData } = createCustomerDto;
        const customer = this.repository.create(customerData);
        const savedCustomer = await this.repository.save(customer);
        if (measurement) {
            await this.measurementsService.create({
                ...measurement,
                customer_id: savedCustomer.id,
            });
        }
        return this.findOne(savedCustomer.id);
    }
    parseStatusFilter(status) {
        const values = status
            .split(',')
            .map((value) => value.trim().toLowerCase())
            .filter(Boolean);
        const unknown = values.filter((value) => !customer_entity_1.CUSTOMER_STATUSES.includes(value));
        if (unknown.length > 0) {
            throw new common_1.BadRequestException(`Unknown status: ${unknown.join(', ')}. Expected ${customer_entity_1.CUSTOMER_STATUSES.join(' or ')}.`);
        }
        return [...new Set(values)];
    }
    async findAll(page = 1, limit = 10, search = '', status = '') {
        const currentPage = Number.isInteger(Number(page)) && Number(page) > 0 ? Number(page) : 1;
        const pageSize = Number.isInteger(Number(limit)) && Number(limit) > 0
            ? Math.min(Number(limit), 100)
            : 10;
        const normalizedSearch = search.trim();
        const statuses = this.parseStatusFilter(status);
        const statusWhere = statuses.length === 0
            ? {}
            : { status: statuses.length === 1 ? statuses[0] : (0, typeorm_2.In)(statuses) };
        const where = normalizedSearch
            ? [
                { ...statusWhere, name: (0, typeorm_2.Like)(`%${normalizedSearch}%`) },
                { ...statusWhere, phone: (0, typeorm_2.Like)(`%${normalizedSearch}%`) },
            ]
            : statusWhere;
        const [data, total] = await this.repository.findAndCount({
            where,
            relations: { measurements: true },
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
        const customer = await this.repository.findOne({
            where: { id: id },
            relations: { measurements: true },
        });
        if (!customer)
            throw new common_1.NotFoundException({
                status: common_1.HttpStatus.NOT_FOUND,
                data: ['Customer Not Found'],
            });
        return customer;
    }
    async update(id, updateCustomerDto) {
        const customer = await this.findOne(id);
        Object.assign(customer, updateCustomerDto);
        return this.repository.save(customer);
    }
    async remove(ids) {
        if (!Array.isArray(ids) ||
            ids.length === 0 ||
            ids.some((id) => !Number.isInteger(id) || id <= 0)) {
            throw new common_1.BadRequestException('A non-empty array of valid customer ids is required');
        }
        const deleteResult = await this.repository.delete(ids);
        if (deleteResult.affected === 0) {
            throw new common_1.NotFoundException({
                status: common_1.HttpStatus.NOT_FOUND,
                data: ['Customers Not Found'],
            });
        }
        return {
            message: 'Customers deleted successfully',
            affected: deleteResult.affected ?? 0,
        };
    }
};
exports.CustomersService = CustomersService;
exports.CustomersService = CustomersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => measurements_service_1.MeasurementsService))),
    __param(1, (0, typeorm_1.InjectRepository)(customer_entity_1.Customer)),
    __metadata("design:paramtypes", [measurements_service_1.MeasurementsService,
        typeorm_2.Repository])
], CustomersService);
//# sourceMappingURL=customers.service.js.map