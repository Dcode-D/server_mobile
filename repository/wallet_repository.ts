import { AppDataSource } from "../config/database.js";
import { Wallet } from "../model/wallet.js";

export const WalletRepository = AppDataSource.getRepository(Wallet);
