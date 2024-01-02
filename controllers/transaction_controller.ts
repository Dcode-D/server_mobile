import { NextFunction, Request, Response } from "express";
import { TransactionRepository } from "../repository/transaction_repository";
import { UserRepository } from "../repository/user_repository";
import { WalletRepository } from "../repository/wallet_repository";
import transaction_variable from "../variables/transaction_variable";
import { otpGenerator } from "../method/sms_method";
import { OTP, OtpType } from "../model/otp";
import { OTPRepository } from "../repository/otp_repository";
import { sendSMS } from "../method/sms_method";
import { Between, ILike } from "typeorm";

export class TransactionController {
  static async createTransferTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const amount = Number(req.body.amount);
      const from = req.body.from_User;
      const to = req.body.to_User;
      const message = req.body.message;
      const fcmToken = req.body.fcm_token;
      const time = new Date();

      if(req.user["id"] !== from) return res.status(404).json({"message":"Invalid transaction!"});

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

      if (
        !from_User ||
        !to_User ||
        !from_Wallet ||
        !to_Wallet ||
        from_User.active === false ||
        to_User.active === false
      )
        return res.status(404).json({ message: "Invalid transaction!" });

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
      createOTP.user = from_User;
      from_Transaction.otp = createOTP;

      await OTPRepository.save(createOTP);
      await TransactionRepository.save(from_Transaction);

      //SEND OTP
      // sendSMS(otp, from_User.phone_number);
      sendSMS(otp, null);

      return res.status(200).json({
        message: "OTP SENT",
        otp_data: otp,
      });
    } catch (e) {
      return res
        .status(500)
        .json({ message: "There was an error, please try again" });
    }
  }

  static async createTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const amount = Number(req.body.amount);
      const from = req.user["id"];
      const to = req.body.to_User;
      const message = req.body.message;
      const type = req.body.type;
      const time = new Date();

      if (transaction_variable.receive_Type.includes(type)) {
        //find user's wallet
        // const to_Wallet = await WalletRepository.findOne({
        //   where: { id: to },
        //   relations: { user: true },
        // });
        //
        // const to_User = await UserRepository.findOne({
        //   where: { id: to_Wallet.user.id },
        // });
        //
        // if (!to_Wallet) return res.status(404);
        //
        //
        // const transaction = TransactionRepository.create({
        //   type: type,
        //   from_User: from,
        //   to_User: to,
        //   to_Wallet: to_Wallet.id,
        //   amount: amount,
        //   message: message,
        //   time: time,
        //   status: "Pending",
        //   user: to_User,
        // });
        //
        // //OTP GENERATION
        //
        // const otp = otpGenerator();
        //
        //
        //
        // const createOTP = new OTP();
        // createOTP.otp = otp;
        // createOTP.created_at = new Date();
        // createOTP.otp_type = OtpType.TRANSACTION;
        // createOTP.user = to_User;
        // transaction.otp= createOTP;
        //
        // await OTPRepository.save(createOTP);
        // await TransactionRepository.save(transaction);
        //
        // //SEND OTP
        // //sendSMS(otp, from_User.phone_number);
        //
        // return res.status(200).json({ message: "OTP SENT", otp: otp });
      } else if (transaction_variable.transfer_Type.includes(type)) {
        const from_User = await UserRepository.findOne({
          where: { id: from },
        });
        //#region find user's wallet
        const from_Wallet = await WalletRepository.findOne({
          where: { user: {id:from_User.id} },
        });
        if(!from_User||!from_User.active) return res.status(404).json({ message: "Invalid transaction!" });

        if (!from_Wallet) return res.status(404).json({ message: "Invalid wallet!" });



        const transaction = TransactionRepository.create({
          type: type,
          from_User: from_User.id,
          to_User: from_User.id,
          from_Wallet: from_Wallet.id,
          to_Wallet: from_Wallet.id,
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
        createOTP.otp_type = OtpType.TRANSACTION;
        createOTP.user = from_User;
        transaction.otp = createOTP;

        sendSMS(otp, null);

        await OTPRepository.save(createOTP);
        await TransactionRepository.save(transaction);

        //SEND OTP
        //sendSMS(otp, from_User.phone_number);

        return res.status(200).json({ message: "OTP SENT", otp_data: otp });
      }
    } catch (e) {
      return res.status(404).json({ message: e.message });
    }
  }

  //the query from and to can be used to filter the transaction
  static async getTransactions(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.params.user_id;
      let from = req.query.from;
      let to = req.query.to;
      let type = req.query.type;
      let status = req.query.status;

      const user = await UserRepository.findOne({
        where: {
          id: id,
        },
      });

      if (!user) return res.status(404).json("Can not find user");
      //check uer permission to view transaction
      if (
        (req["admin"] == null ||
          req["admin"] == undefined ||
          req["admin"] == false) &&
        user.id != req.user["id"]
      )
        return res.status(401).json("Unauthorized");
      //initialize where condition

      let whereCondition: any = { user: user.id };
      //date filter
      if (from && to) {
        const fromDate = new Date(from as string);
        const toDate = new Date(to as string);

        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          return res.status(400).json("Invalid date format");
        }

        whereCondition.time = Between(fromDate, toDate);
      }
      //type filter
      if (type) {
        // Convert both type and transaction types to lowercase for case-insensitive comparison
        whereCondition.type = ILike(`%${type}%`);
      }
      //status filter
      if (status) {
        // Convert both type and transaction types to lowercase for case-insensitive comparison
        whereCondition.status = ILike(`%${status}%`);
      }
      //find transactions with the where condition
      const transactions = await TransactionRepository.find({
        where: whereCondition,
      });
      //return transactions
      return res.status(200).json(transactions);
    } catch (e) {
      //return error
      return res.status(503).json({ message: e.message });
    }
  }

  static async getSingleTransaction(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const id = req.params.id;
      const transactions = await TransactionRepository.findOne({
        where: { id: id },
      });
      return res.status(200).json(transactions);
    } catch (e) {
      return res.status(503).json({ message: e.message });
    }
  }
}
