import { Measurement } from "../../measurements/entities/measurement.entity";
export declare class Customer {
    id: number;
    name: string;
    phone: string;
    status: 'active' | 'inactive';
    last_name?: string;
    measurements: Measurement[];
    created_at: Date;
    updated_at: Date;
}
