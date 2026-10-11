import { Measurement } from "../../measurements/entities/measurement.entity";
import { Order } from "../../orders/entities/order.entity";
export declare const CUSTOMER_STATUSES: readonly ["active", "inactive"];
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];
export declare class Customer {
    id: number;
    name: string;
    phone: string;
    status: CustomerStatus;
    last_name?: string;
    measurements: Measurement[];
    orders: Order[];
    created_at: Date;
    updated_at: Date;
}
