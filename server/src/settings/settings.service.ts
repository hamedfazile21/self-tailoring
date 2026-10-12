import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
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

  /**
   * Writes a setting without the caller having to know whether it exists yet,
   * which is what a client storing its own preferences needs: the first save
   * is an insert, every one after is an edit.
   *
   * `key` carries no unique constraint, so a plain `create` on every save
   * would pile up rows differing only by id — and `findOne` would then return
   * whichever the database felt like.
   */
  async upsert(key: string, upsertSettingDto: UpsertSettingDto) {
    const existing = await this.findOne(key);

    if (existing) {
      existing.value = upsertSettingDto.value;
      return await this.settingRepository.save(existing);
    }

    return await this.create({ key, value: upsertSettingDto.value });
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
