import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user";

@Entity()
export class Wallet {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  balance: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column({nullable: true})
  card_number: string;

  @ManyToOne(()=> User, (user) => user.wallets)
  user: User
}
