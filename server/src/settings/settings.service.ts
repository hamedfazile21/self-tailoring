import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { Setting } from './entities/setting.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingRepository: Repository<Setting>,
  ) {}

  async create(createSettingDto: CreateSettingDto) {
    const newRow = this.settingRepository.create(createSettingDto);
    await this.settingRepository.save(newRow);
    return newRow;
  }

  async findAll() {
    return await this.settingRepository.find();
  }

  async findOne(key: string) {
    return await this.settingRepository.findOne({ where: { key } });
  }

  async update(key: string, updateSettingDto: UpdateSettingDto) {
    const setting = await this.findOne(key);
    if (!setting) {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }
    Object.assign(setting, updateSettingDto);
    return await this.settingRepository.save(setting);
  }

  async remove(key: string) {
    const findKey = await this.settingRepository.findOne({ where: { key } });
    if (findKey) {
      return await this.settingRepository.remove(findKey);
    } else {
      throw new NotFoundException(`Setting with key ${key} not found`);
    }
  }
}
