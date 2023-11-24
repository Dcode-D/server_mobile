import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany, OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";
import {Transaction} from "./transaction";
import {User} from "./user";

export enum OtpType {
  REGISTER = 'REGISTER',
  TRANSFER_TRANSACTION = 'TRANSFER_TRANSACTION',
  TRANSACTION = 'TRANSACTION',
  CHANGE_PASSWORD = 'CHANGE_PASSWORD',
}

@Entity()
export class OTP {
  @PrimaryGeneratedColumn()
  otp: string;

  @Column()
  created_at: Date;

  @Column({nullable:false,type: "enum", enum: OtpType})
  otp_type: OtpType

  @ManyToOne(()=>User,(user)=>null)
  user: User;

  @OneToOne(()=> Transaction, (transaction)=> transaction.otp)
  transaction: Transaction;
}