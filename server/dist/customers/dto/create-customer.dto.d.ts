import { CreateMeasurementDto } from "../../measurements/dto/create-measurement.dto";
declare const CustomerMeasurementDto_base: import("@nestjs/mapped-types").MappedType<Omit<CreateMeasurementDto, "customer_id">>;
declare class CustomerMeasurementDto extends CustomerMeasurementDto_base {
}
export declare class CreateCustomerDto {
    name: string;
    last_name?: string;
    phone: string;
    status?: 'active' | 'inactive';
    measurement?: CustomerMeasurementDto;
}
export {};
