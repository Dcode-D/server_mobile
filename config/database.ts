import { DataSource, EntitySchema } from "typeorm";
import { OTP } from "../model/otp";
import { Promotion } from "../model/promotion";
import { Transaction } from "../model/transaction";
import { User } from "../model/user";
import { Wallet } from "../model/wallet";
import Database from "../variables/database_variable";

export const EntitySchemas = {
    User,
    Wallet,
    Transaction,
    Promotion,
    OTP
}

export const AppDataSource = new DataSource({
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "root",
    password: "root",
    database: "ewallet",
    synchronize: true,
    // migrationsRun: true,
    logging: true,
    entities: ["dist/model/*.js"],
});
