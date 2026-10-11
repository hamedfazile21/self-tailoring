import { User } from 'src/users/entities/user.entity';
import { Measurement } from 'src/measurements/entities/measurement.entity';
import { Order } from 'src/orders/entities/order.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

/** The only values the `status` column accepts, shared with the query filter. */
export const CUSTOMER_STATUSES = ['active', 'inactive'] as const;

export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

@Entity('customers')
export class Customer {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 15 })
  phone!: string;

  @Column({
    type: 'enum',
    enum: [...CUSTOMER_STATUSES],
    default: 'active',
  })
  status!: CustomerStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  last_name?: string;

  @OneToMany(() => Measurement, (measurement) => measurement.customer)
  measurements!: Measurement[];

  @OneToMany(() => Order, (order) => order.customer)
  orders!: Order[];

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}
