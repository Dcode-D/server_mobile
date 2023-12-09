import { AppDataSource } from "../config/database.js";
import { Token } from "../model/token.js";

export const TokenRepository = AppDataSource.getRepository(Token);