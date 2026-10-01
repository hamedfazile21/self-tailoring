import { Customer } from "../../customers/entities/customer.entity";
import { Measurement } from "../../measurements/entities/measurement.entity";
export declare class Order {
    id: number;
    customer: Customer;
    measurement: Measurement;
    start_date: string;
    end_date: string;
    collar_type: string;
    pants_type: string;
    sleeve_type: string;
    chest_pocket: boolean;
    quantity: number;
    price: number;
}
