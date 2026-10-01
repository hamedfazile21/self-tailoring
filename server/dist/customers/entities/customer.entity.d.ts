import { Measurement } from "../../measurements/entities/measurement.entity";
import { Order } from "../../orders/entities/order.entity";
export declare class Customer {
    id: number;
    name: string;
    phone: string;
    status: 'active' | 'inactive';
    last_name?: string;
    measurements: Measurement[];
    orders: Order[];
    created_at: Date;
    updated_at: Date;
}
