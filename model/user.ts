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
export class User {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  full_name: string;

  @Column({
    length: 10
  })
  phone_number: string;

  @Column({
    length: 12
  })
  identify_ID: string;

  @Column()
  birthday: Date;

  @Column()
  password_hash: string;

  @Column()
  salt: string;
}