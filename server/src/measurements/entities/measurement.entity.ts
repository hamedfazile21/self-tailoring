import { Customer } from 'src/customers/entities/customer.entity';
import { Order } from 'src/orders/entities/order.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('measurements')
export class Measurement {
  @PrimaryGeneratedColumn({ type: 'int' })
  id!: number;

  @ManyToOne(() => Customer, (customer) => customer.measurements, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @OneToMany(() => Order, (order) => order.measurement)
  orders!: Order[];

  @Column({ type: 'int' })
  length!: number;

  @Column({ type: 'int' })
  shoulder!: number;

  @Column({ type: 'int' })
  sleeve_length!: number;

  @Column({ type: 'int', nullable: true })
  collar!: number;

  @Column({ type: 'int' })
  chest!: number;

  @Column({ type: 'int', nullable: true })
  hem!: number;

  @Column({ type: 'int' })
  cuff!: number;

  @Column({ type: 'int' })
  pants_length!: number;

  @CreateDateColumn({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at!: Date;

  @UpdateDateColumn({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at!: Date;
}

// id
// name
// length
// shoulder
// sleeve_length
// collar
// chest
// hem
// cuff
// pants_length
// fabric
// created_at
// updated_at
