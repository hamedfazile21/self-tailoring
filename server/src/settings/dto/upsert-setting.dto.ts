import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Body of `PUT /settings/upsert/:key`. The key rides on the path, so only the
 * value is sent — and it is required, because the upsert may be an insert into
 * a `NOT NULL` column.
 */
export class UpsertSettingDto {
  @IsString()
  @IsNotEmpty()
  value!: string;
}
