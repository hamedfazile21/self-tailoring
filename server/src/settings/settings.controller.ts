import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { UpsertSettingDto } from './dto/upsert-setting.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  create(@Body() createSettingDto: CreateSettingDto) {
    return this.settingsService.create(createSettingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('show/:key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findOne(key);
  }

  /** Create-or-edit in one call, for a client saving its own preferences. */
  @UseGuards(JwtAuthGuard)
  @Put('upsert/:key')
  upsert(
    @Param('key') key: string,
    @Body() upsertSettingDto: UpsertSettingDto,
  ) {
    return this.settingsService.upsert(key, upsertSettingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('update/:key')
  update(
    @Param('key') key: string,
    @Body() updateSettingDto: UpdateSettingDto,
  ) {
    return this.settingsService.update(key, updateSettingDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('delete/:key')
  remove(@Param('key') key: string) {
    return this.settingsService.remove(key);
  }
}
