"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const customers_module_1 = require("./customers/customers.module");
const customer_entity_1 = require("./customers/entities/customer.entity");
const users_module_1 = require("./users/users.module");
const user_entity_1 = require("./users/entities/user.entity");
const auth_module_1 = require("./auth/auth.module");
const measurements_module_1 = require("./measurements/measurements.module");
const measurement_entity_1 = require("./measurements/entities/measurement.entity");
const orders_module_1 = require("./orders/orders.module");
const order_entity_1 = require("./orders/entities/order.entity");
const settings_module_1 = require("./settings/settings.module");
const setting_entity_1 = require("./settings/entities/setting.entity");
const dashboard_module_1 = require("./dashboard/dashboard.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'mysql',
                    host: configService.get('DB_HOST'),
                    port: configService.get('DB_PORT'),
                    username: configService.get('DB_USERNAME'),
                    password: configService.get('DB_PASSWORD'),
                    database: configService.get('DB_NAME'),
                    socketPath: '/opt/lampp/var/mysql/mysql.sock',
                    entities: [customer_entity_1.Customer, user_entity_1.User, measurement_entity_1.Measurement, order_entity_1.Order, setting_entity_1.Setting],
                    autoLoadEntities: true,
                    synchronize: true,
                    charset: 'utf8mb4_unicode_ci',
                }),
            }),
            customers_module_1.CustomersModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            measurements_module_1.MeasurementsModule,
            orders_module_1.OrdersModule,
            settings_module_1.SettingsModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map