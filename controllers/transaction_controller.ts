import { Response, Request, NextFunction } from "express";
import { User } from "../model/user";
import { TransactionRepository } from "../repository/transaction_repository";
import { UserRepository } from "../repository/user_repository";
import { WalletRepository } from "../repository/wallet_repository";
import { WalletController } from "./wallet_controller";
import transaction_variable, {
  receive_Type,
} from "../variables/transaction_variable";

export class TransactionController {
  static async createTransferTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const amount = req.body.amount;
    const from = req.body.from_User;
    const to = req.body.to_User;
    const message = req.body.message;
    const time = Date.now();

    //#region find user's wallet
    const from_Wallet = await WalletRepository.findOne({
      where: { id: from },
    });
    const to_Wallet = await WalletRepository.findOne({
      where: { id: to },
    });
    //#endregion

    //#region find user
    const from_User = await UserRepository.findOne({
      where: { id: from_Wallet.user.id },
    });
    const to_User = await UserRepository.findOne({
      where: { id: to_Wallet.user.id },
    });
    //#region

    if(!from_User||!to_User||!from_Wallet||!to_Wallet) return res.status(404);

    to_Wallet.balance = to_Wallet.balance + amount;
    from_Wallet.balance = from_Wallet.balance - amount;

    const from_Transaction = TransactionRepository.create({
      type: "TRANSFER",
      from_User: from,
      to_User: to,
      amount: amount,
      message: message,
      time: time,
      status: "Completed",
    });

    const to_Transaction = TransactionRepository.create({
      type: "RECEIVE",
      from_User: from,
      to_User: to,
      amount: amount,
      message: message,
      time: time,
      status: "Completed",
    });

    await WalletRepository.save([to_Wallet, from_Wallet]);
    await TransactionRepository.save([to_Transaction, from_Transaction]);
    return res.status(200).json({
      from_Transaction,
      from_User: {
        id: from_User.id,
        full_name: from_User.full_name,
        phone_number: from_User.phone_number,
      },
      to_User:{
        id: to_User.id,
        full_name: to_User.full_name,
        phone_number: to_User.phone_number,
      }
    });
  }

  static async createTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const amount = req.body.amount;
    const from = req.body.from_User;
    const to = req.body.to_User;
    const message = req.body.message;
    const type = req.body.type;
    const time = Date.now();

    if (transaction_variable.receive_Type.includes(type)) {
      //find user's wallet
      const to_Wallet = await WalletRepository.findOne({
        where: { id: to },
      });

      if(!to_Wallet) return res.status(404);

      to_Wallet.balance += amount;

      const transaction = TransactionRepository.create({
        type: type,
        from_User: from,
        to_User: to,
        amount: amount,
        message: message,
        time: time,
        status: "Completed",
      });

      await WalletRepository.save(to_Wallet);
      await TransactionRepository.save(transaction);

      return res.json(transaction);
    } else if (transaction_variable.transfer_Type.includes(type)) {
      //#region find user's wallet
      const from_Wallet = await WalletRepository.findOne({
        where: { id: from },
      });

      if(!from_Wallet) return res.status(404);

      from_Wallet.balance -= amount;

      const transaction = TransactionRepository.create({
        type: type,
        from_User: from,
        to_User: to,
        amount: amount,
        message: message,
        time: time,
        status: "Completed",
      });

      await WalletRepository.save(from_Wallet);
      await TransactionRepository.save(transaction);

      return res.status(200).json(transaction);
    }
  }

  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    const user = await UserRepository.findOne({
      where: {
        id: id,
      },
      relations: {
        transactions: true,
      },
    });
    if (!user) return res.status(404).json("Can not find user");
    return res.status(200).json(user.transactions);
  }
}
