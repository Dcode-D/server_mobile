import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,OneToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user";
import {OTP} from "./otp";

@Entity()
export class Transaction {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  type: string;

  @Column()
  from_User: string;

  @Column()
  to_User: string;

  @Column()
  from_Wallet: string;

  @Column()
  to_Wallet: string;

  @Column()
  amount: number;

  @Column({
    nullable: true,
  })
  message: string;

  @Column()
  time: Date;

  @Column()
  status: string;

  @ManyToOne(()=> User, (user)=> user.transactions)
  user: User;

  @OneToOne(()=> OTP, (otp)=> otp.transaction,{cascade: true,nullable:true})
  @JoinColumn()
    otp: OTP;
}
