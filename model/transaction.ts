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
export class Transaction {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  type: string;

  @Column()
  from_User: number;

  @Column()
  to_User: string;

  @Column()
  amount: number;

  @Column({
    nullable: true,
  })
  message: string;

  @Column()
  time: Date;

  @ManyToOne(()=> User, (user)=> user.transactions)
  user: User;
}
