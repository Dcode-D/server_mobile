import { Response, Request, NextFunction } from "express";
import { TransactionRepository } from "../repository/transaction_repository";
import { UserRepository } from "../repository/user_repository";
import { WalletRepository } from "../repository/wallet_repository";
import { receive_Type } from "../variables/transaction_variable";

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

    to_Wallet.balance = to_Wallet.balance + amount;
    from_Wallet.balance = from_Wallet.balance - amount;

    const from_Transaction = TransactionRepository.create({
      type: "TRANSFER",
      from_User: from_Wallet.user.id,
      to_User: to_Wallet.user.id,
      amount: amount,
      message: message,
      time: time,
      status: "Completed",
      user: from_Wallet.user
    });

    const to_Transaction = TransactionRepository.create({
      type: "RECEIVE",
      from_User: from_Wallet.user.id,
      to_User: to_Wallet.user.id,
      amount: amount,
      message: message,
      time: time,
      status: "Completed",
      user: to_Wallet.user,
    });

    await WalletRepository.save([to_Wallet,from_Wallet]);
    await TransactionRepository.save([to_Transaction,from_Transaction])
    return res.json({
        from_Transaction
    })
  }

  static async getTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const id = req.params.id;
    const user = await UserRepository.findOne({
      where: {
        id: id,
      },
      relations: {
        transactions: true,
      },
    });
    if (!user) return res.json("Can not find user");
    return res.json(user.transactions);
  }
}
