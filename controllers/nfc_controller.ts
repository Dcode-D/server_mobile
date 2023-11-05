import { Response, Request, NextFunction } from "express";
import { TransactionRepository } from "../repository/transaction_repository";
import { UserRepository } from "../repository/user_repository";
import { WalletRepository } from "../repository/wallet_repository";
import fcmSend from "./notification_controller";

export class NFCController {
  static async createTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    console.log(req);
    const amount = Number(req.body.amount);
    const from = req.body.from_User;
    const to = req.body.to_User;
    const type = req.body.type;
    const time = new Date();

    const from_Wallet = await WalletRepository.findOne({
      where: { id: from },
      relations: { user: true },
    });

    const from_User = await UserRepository.findOne({
      where: { id: from_Wallet.user.id },
    });

    if (!from_User || !from_Wallet) return res.status(404);

    from_Wallet.balance = Number(from_Wallet.balance) - amount;

    const from_Transaction = TransactionRepository.create({
      type: type,
      from_User: from,
      to_User: to,
      amount: amount,
      message: '',
      time: time,
      status: "Completed",
      user: from_User,
    });

    await TransactionRepository.save(from_Transaction);

    fcmSend(
      {
        title: "Ewallet",
        body: "Bạn vừa thanh toán đơn hàng",
      },
      from_User.device_token
    );

    return res.status(200).json({
      type: "TRANSACTION",
      message: "SUCCESS",
    });
  }
}
