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
exports.MeasurementsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const measurement_entity_1 = require("./entities/measurement.entity");
const typeorm_2 = require("@nestjs/typeorm");
const customers_service_1 = require("../customers/customers.service");
let MeasurementsService = class MeasurementsService {
    customersService;
    repository;
    constructor(customersService, repository) {
        this.customersService = customersService;
        this.repository = repository;
    }
    async create(createMeasurementDto) {
        const { customer_id, ...measurementData } = createMeasurementDto;
        const customer = await this.customersService.findOne(customer_id);
        const newRecode = this.repository.create({
            ...measurementData,
            customer,
        });
        await this.repository.save(newRecode);
        return createMeasurementDto;
    }
    async findAll() {
        return await this.repository.find();
    }
    async findOne(id) {
        const findRow = await this.repository.findOne({ where: { id } });
        if (!findRow) {
            throw new common_1.NotFoundException({
                status: common_1.HttpStatus.NOT_FOUND,
                data: ['Measurement Not Found'],
            });
        }
        return findRow;
    }
    async update(id, updateMeasurementDto) {
        const { customer_id, ...rest } = updateMeasurementDto;
        await this.customersService.findOne(customer_id || 0);
        await this.findOne(id);
        await this.repository.update(id, rest);
        return this.findOne(id);
    }
    async remove(id) {
        const currentRow = await this.repository.delete(id);
        if (currentRow.affected === 0) {
            throw new common_1.NotFoundException({
                status: common_1.HttpStatus.NOT_FOUND,
                data: ['Customer Not Found'],
            });
        }
        return ['measurement deleted successfully'];
    }
};
exports.MeasurementsService = MeasurementsService;
exports.MeasurementsService = MeasurementsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => customers_service_1.CustomersService))),
    __param(1, (0, typeorm_2.InjectRepository)(measurement_entity_1.Measurement)),
    __metadata("design:paramtypes", [customers_service_1.CustomersService,
        typeorm_1.Repository])
], MeasurementsService);
//# sourceMappingURL=measurements.service.js.map