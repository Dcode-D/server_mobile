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
export class Promotion {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  description: string;

  @Column()
  start_Time: Date;

  @Column()
  end_Time: Date;

  @Column()
  type: string;

  @Column()
  name: string;

  @Column()
  amount: number;
}
