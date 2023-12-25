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
    const to_User = await UserRepository.findOne({
        where: { id: to },
        });

    const to_Wallet = await WalletRepository.findOne({
        where: { id: to },
        relations: { user: true },
    });

    if (!from_User || !from_Wallet) return res.status(404);

    from_Wallet.balance = Number(from_Wallet.balance) - amount;
    to_Wallet.balance = Number(to_Wallet.balance) + amount;
    if(from_Wallet.balance < 0) return res.status(400).json({
        type: "TRANSACTION",
        message: "FAIL",
    });

    const from_Transaction = TransactionRepository.create({
      type: type,
      from_User: from,
      to_User: to,
      from_Wallet: from_Wallet.id,
      to_Wallet: to_Wallet.id,
      amount: amount,
      message: '',
      time: time,
      status: "success",
      user: from_User,
    });
    const to_Transaction = TransactionRepository.create({
        type: type,
        from_User: from,
        to_User: to,
        from_Wallet: from_Wallet.id,
        to_Wallet: to_Wallet.id,
        amount: amount,
        message: '',
        time: time,
        status: "success",
        user: to_User,
    });


    await TransactionRepository.save(from_Transaction);
    await WalletRepository.save(from_Wallet);
    await TransactionRepository.save(to_Transaction);
    await WalletRepository.save(to_Wallet);

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
