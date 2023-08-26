import { DataSource, EntitySchema } from "typeorm";
import { User } from "../model/user";
import Database from "../variables/database_variable";

export const EntitySchemas = {
    User
}

export const AppDataSource = new DataSource({
  type: "oracle",
  host: "localhost",
  port:1521,
  username: Database.user,
  password: Database.password,
  serviceName:"Ewallet",
  database: "Ewallet",
  synchronize: true,
  logging: true,
  entities: EntitySchemas,
  subscribers: [],
  migrations: [],
});
