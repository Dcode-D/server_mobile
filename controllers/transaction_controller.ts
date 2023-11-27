import {NextFunction, Request, Response} from "express";
import {TransactionRepository} from "../repository/transaction_repository";
import {UserRepository} from "../repository/user_repository";
import {WalletRepository} from "../repository/wallet_repository";
import transaction_variable from "../variables/transaction_variable";
import {otpGenerator} from "../method/sms_method";
import {OTP, OtpType} from "../model/otp";
import {OTPRepository} from "../repository/otp_repository";

export class TransactionController {
  static async createTransferTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const amount = Number(req.body.amount);
    const from = req.body.from_User;
    const to = req.body.to_User;
    const message = req.body.message;
    const fcmToken = req.body.fcm_token;
    const time = new Date();

    //#region find user's wallet
    const from_Wallet = await WalletRepository.findOne({
      where: { id: from },
      relations: { user: true },
    });
    const to_Wallet = await WalletRepository.findOne({
      where: { id: to },
      relations: { user: true },
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

    if (!from_User || !to_User || !from_Wallet || !to_Wallet)
      return res.status(404).json({"message":"Invalid transaction!"});

    const from_Transaction = TransactionRepository.create({
      type: "TRANSFER",
      from_User: from,
      to_User: to,
      from_Wallet: from_Wallet.id,
      to_Wallet: to_Wallet.id,
      amount: amount,
      message: message,
      time: time,
      status: "Pending",
      user: from_User,
    });

    //OTP GENERATION

    const otp = otpGenerator();


    const createOTP = new OTP();
    createOTP.otp = otp;
    createOTP.created_at = new Date();
    createOTP.transaction = from_Transaction;
    createOTP.otp_type = OtpType.TRANSFER_TRANSACTION;
    createOTP.user= from_User;
    from_Transaction.otp = createOTP;

    await OTPRepository.save(createOTP);
    await TransactionRepository.save(from_Transaction);

    //SEND OTP
    //sendSMS(otp, from_User.phone_number);

    return res.status(200).json({
      message: "OTP SENT",
      otp_data: otp,
    });
  }

  static async createTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const amount = Number(req.body.amount);
    const from = req.body.from_User;
    const to = req.body.to_User;
    const message = req.body.message;
    const type = req.body.type;
    const time = new Date();

    if (transaction_variable.receive_Type.includes(type)) {
      //find user's wallet
      const to_Wallet = await WalletRepository.findOne({
        where: { id: to },
        relations: { user: true },
      });

      const to_User = await UserRepository.findOne({
        where: { id: to_Wallet.user.id },
      });

      if (!to_Wallet) return res.status(404);

      to_Wallet.balance = Number(to_Wallet.balance) + amount;

      const transaction = TransactionRepository.create({
        type: type,
        from_User: from,
        to_User: to,
        to_Wallet: to_Wallet.id,
        amount: amount,
        message: message,
        time: time,
        status: "Pending",
        user: to_User,
      });

      //OTP GENERATION

      const otp = otpGenerator();



      const createOTP = new OTP();
      createOTP.otp = otp;
      createOTP.created_at = new Date();
      createOTP.otp_type = OtpType.TRANSACTION;
      createOTP.user = to_User;
      transaction.otp= createOTP;

      await OTPRepository.save(createOTP);
      await TransactionRepository.save(transaction);

      //SEND OTP
      //sendSMS(otp, from_User.phone_number);

      return res.status(200).json({ message: "OTP SENT", otp: otp });
    } else if (transaction_variable.transfer_Type.includes(type)) {
      //#region find user's wallet
      const from_Wallet = await WalletRepository.findOne({
        where: { id: from },
        relations: { user: true },
      });

      if (!from_Wallet) return res.status(404);

      const from_User = await UserRepository.findOne({
        where: { id: from_Wallet.user.id },
      });

      from_Wallet.balance = Number(from_Wallet.balance) - amount;

      const transaction = TransactionRepository.create({
        type: type,
        from_User: from,
        to_User: to,
        from_Wallet: from_Wallet.id,
        amount: amount,
        message: message,
        time: time,
        status: "Pending",
        user: from_User,
      });

      //OTP GENERATION

      const otp = otpGenerator();


      const createOTP = new OTP();
      createOTP.otp = otp;
      createOTP.created_at = new Date();
      createOTP.otp_type= OtpType.TRANSACTION;
      createOTP.user= from_User;
      transaction.otp = createOTP;

      await OTPRepository.save(createOTP);
      await TransactionRepository.save(transaction);

      //SEND OTP
      //sendSMS(otp, from_User.phone_number);

      return res.status(200).json({ message: "OTP SENT", otp_data: otp });
    }
  }

  static async getTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const id = req.params.user_id;
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
