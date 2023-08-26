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
export class Wallet {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  user_ID: string;

  @Column()
  balance: number;

  @Column()
  name: string;

  @Column()
  type: string;

  @Column()
  card_number: string;
}
