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
export class Token {
    @PrimaryGeneratedColumn()
    id: string;

    @Column({default:""})
    token: string;

    @ManyToOne(()=> User, (user)=> user.tokens, {onDelete: "CASCADE"})
    user: User;
}
