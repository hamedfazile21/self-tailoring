import { Customer } from 'src/customers/entities/customer.entity';
import { Measurement } from 'src/measurements/entities/measurement.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @ManyToOne(() => Customer, (customer) => customer.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @ManyToOne(() => Measurement, (measurement) => measurement.orders, {
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'measurement_id' })
  measurement!: Measurement;

  @Column({ type: 'date' })
  start_date!: string;

  @Column({ type: 'date' })
  end_date!: string;

  @Column({ type: 'varchar', length: 100 })
  collar_type!: string;

  @Column({ type: 'varchar', length: 100 })
  pants_type!: string;

  @Column({ type: 'varchar', length: 100 })
  sleeve_type!: string;

  @Column({ type: 'boolean', default: false })
  chest_pocket!: boolean;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'enum', enum: ['pending', 'done'], default: 'pending' })
  status!: 'pending' | 'done';
}
