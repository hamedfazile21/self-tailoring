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
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const setting_entity_1 = require("./entities/setting.entity");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
let SettingsService = class SettingsService {
    settingRepository;
    constructor(settingRepository) {
        this.settingRepository = settingRepository;
    }
    async create(createSettingDto) {
        const newRow = this.settingRepository.create(createSettingDto);
        await this.settingRepository.save(newRow);
        return newRow;
    }
    async findAll() {
        return await this.settingRepository.find();
    }
    async findOne(key) {
        return await this.settingRepository.findOne({ where: { key } });
    }
    async upsert(key, upsertSettingDto) {
        const existing = await this.findOne(key);
        if (existing) {
            existing.value = upsertSettingDto.value;
            return await this.settingRepository.save(existing);
        }
        return await this.create({ key, value: upsertSettingDto.value });
    }
    async update(key, updateSettingDto) {
        const setting = await this.findOne(key);
        if (!setting) {
            throw new common_1.NotFoundException(`Setting with key ${key} not found`);
        }
        Object.assign(setting, updateSettingDto);
        return await this.settingRepository.save(setting);
    }
    async remove(key) {
        const findKey = await this.settingRepository.findOne({ where: { key } });
        if (findKey) {
            return await this.settingRepository.remove(findKey);
        }
        else {
            throw new common_1.NotFoundException(`Setting with key ${key} not found`);
        }
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(setting_entity_1.Setting)),
    __metadata("design:paramtypes", [typeorm_1.Repository])
], SettingsService);
//# sourceMappingURL=settings.service.js.map