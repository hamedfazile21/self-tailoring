import { PartialType } from '@nestjs/mapped-types';
import { CreateSettingDto } from './create-setting.dto';
import { IsEmpty, IsString } from 'class-validator';

export class UpdateSettingDto extends PartialType(CreateSettingDto) {}
