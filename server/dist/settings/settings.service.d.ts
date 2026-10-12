import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
import { Setting } from './entities/setting.entity';
import { Repository } from 'typeorm';
export declare class SettingsService {
    private readonly settingRepository;
    constructor(settingRepository: Repository<Setting>);
    create(createSettingDto: CreateSettingDto): Promise<Setting>;
    findAll(): Promise<Setting[]>;
    findOne(key: string): Promise<Setting | null>;
    upsert(key: string, upsertSettingDto: UpsertSettingDto): Promise<Setting>;
    update(key: string, updateSettingDto: UpdateSettingDto): Promise<Setting>;
    remove(key: string): Promise<Setting>;
}
