import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CustomersModule } from './customers/customers.module';
import { Customer } from './customers/entities/customer.entity';
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { MeasurementsModule } from './measurements/measurements.module';
import { Measurement } from './measurements/entities/measurement.entity';
import { OrdersModule } from './orders/orders.module';
import { Order } from './orders/entities/order.entity';
import { SettingsModule } from './settings/settings.module';
import { Setting } from './settings/entities/setting.entity';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // 1 : Enable the .env config
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2 : Connect to database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        socketPath: '/opt/lampp/var/mysql/mysql.sock', // In Linux i should use this path to know xammp
        entities: [Customer, User, Measurement, Order, Setting],
        autoLoadEntities: true,
        synchronize: true,
        charset: 'utf8mb4_unicode_ci', // to support other language like farsi
      }),
    }),

    // 3 : Import Modules
    CustomersModule,

    UsersModule,

    AuthModule,

    MeasurementsModule,

    OrdersModule,

    SettingsModule,

    DashboardModule,
  ],
  // imports: [CustomersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
