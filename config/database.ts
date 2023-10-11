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
  type: "mysql",
  host: "/cloudsql/ewallet-server:asia-southeast1:ewalletdb",
  extra: {
    socketPath: "/cloudsql/ewallet-server:asia-southeast1:ewalletdb",
  },
  username: Database.user,
  password: Database.password,
  database: "Ewallet",
  synchronize: true,
  logging: false,
  entities: ["dist/model/*.js"],
});
