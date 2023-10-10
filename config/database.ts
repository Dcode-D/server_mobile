import { DataSource, EntitySchema } from "typeorm";
import { Promotion } from "../model/promotion";
import { Transaction } from "../model/transaction";
import { User } from "../model/user";
import { Wallet } from "../model/wallet";
import Database from "../variables/database_variable";

export const EntitySchemas = {
    User,
    Wallet,
    Transaction,
    Promotion
}

export const AppDataSource = new DataSource({
  type: "oracle",
  host: "localhost",
  port: 1521,
  username: Database.user,
  password: Database.password,
  serviceName: "Ewallet",
  database: "Ewallet",
  synchronize: true,
  logging: true,
  entities: EntitySchemas,
  subscribers: [],
  migrations: [],
});
