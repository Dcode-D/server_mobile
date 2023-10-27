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
  host: "127.0.0.1",
  port: 3306,
  username: "root",
  password: "NamKhanh201202",
  database: "ewallet2",
  synchronize: true,
  logging: true,
  entities: EntitySchemas,
});
