import { AppDataSource } from "../config/database.js";
import { Transaction } from "../model/transaction.js";

export const TransactionRepository = AppDataSource.getRepository(Transaction);
