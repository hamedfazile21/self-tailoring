import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    create(createSettingDto: CreateSettingDto): Promise<import("./entities/setting.entity").Setting>;
    findAll(): Promise<import("./entities/setting.entity").Setting[]>;
    findOne(key: string): Promise<import("./entities/setting.entity").Setting | null>;
    upsert(key: string, upsertSettingDto: UpsertSettingDto): Promise<import("./entities/setting.entity").Setting>;
    update(key: string, updateSettingDto: UpdateSettingDto): Promise<import("./entities/setting.entity").Setting>;
    remove(key: string): Promise<import("./entities/setting.entity").Setting>;
}
