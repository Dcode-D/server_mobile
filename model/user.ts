import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Transaction } from "./transaction";
import { Wallet } from "./wallet";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  full_name: string;

  @PrimaryColumn({
    length: 10,
  })
  phone_number: string;

  @PrimaryColumn({
    length: 12,
  })
  identify_ID: string;

  @Column()
  birthday: Date;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  job: string;

  @Column()
  password_hash: string;

  @Column()
  salt: string;

  @Column()
  device: string;

  @Column()
  device_token: string;

  @OneToMany(() => Wallet, (wallet) => wallet.user)
  wallets: Wallet[];

  @OneToMany(() => Transaction, (transaction) => transaction.user)
  transactions: Transaction[];
}