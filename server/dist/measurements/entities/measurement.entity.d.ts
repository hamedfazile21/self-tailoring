import { Customer } from "../../customers/entities/customer.entity";
export declare class Measurement {
    id: number;
    customer: Customer;
    length: number;
    shoulder: number;
    sleeve_length: number;
    collar: number;
    chest: number;
    hem: number;
    cuff: number;
    pants_length: number;
    created_at: Date;
    updated_at: Date;
}
