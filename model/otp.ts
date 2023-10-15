import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity()
export class OTP {
  @PrimaryGeneratedColumn()
  otp: string;

  @Column()
  created_at: Date;

  @Column({type: "json"})
  otp_data: Record<string, any>;
}