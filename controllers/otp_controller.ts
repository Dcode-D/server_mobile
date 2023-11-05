import { Response, Request, NextFunction } from "express";
import { otpGenerator, sendSMS, verifyOTP } from "../method/sms_method";
import { OTPRepository } from "../repository/otp_repository";
import { TransactionRepository } from "../repository/transaction_repository";
import { UserRepository } from "../repository/user_repository";
import { WalletRepository } from "../repository/wallet_repository";
import fcmSend from '../controllers/notification_controller';
export class OTPController {
  static async verifyOTPRequest(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const otp = request.body.otp;
    const phone_number = request.body.phone_number;

    const result = await verifyOTP(otp, phone_number);
    if (!result) {
      return response.status(404).json("OTP is not valid");
    }
    const otp_data = result.otp_data;
    if (otp_data.type == "REGISTER") {
      const user = otp_data.user;

      const saveUser = await UserRepository.save(user);

      const createDefaultWallet = WalletRepository.create({
        balance: 0,
        name: "DefaultWallet",
        type: "DefaultWallet",
        card_number: "",
        user: saveUser,
      });
      const saveWallet = await WalletRepository.save(createDefaultWallet);

      user.wallets = saveWallet;
      //DETELE OTP DATA
      OTPRepository.delete({ otp: otp });

      return response.status(201).json({
        type: "REGISTER",
        message: "User created successfully",
        user: saveUser,
      });
    } else if (otp_data.type == "TRANSFER_TRANSACTION") {
      const to_Wallet = otp_data.to_Wallet;
      const from_Wallet = otp_data.from_Wallet;
      const from_Transaction = otp_data.from_Transaction;
      const to_Transaction = otp_data.to_Transaction;

      await WalletRepository.save([to_Wallet, from_Wallet]);
      await TransactionRepository.save([to_Transaction, from_Transaction]);

      const from_User = await UserRepository.findOne({
        where: {id: from_Wallet.user.id}
      })

      const to_User = await UserRepository.findOne({
        where: { id: to_Wallet.user.id },
      });

      //PUSH NOTIFICATION
      fcmSend(
        {
          title: "Ewallet",
          body: "Bạn vừa chuyển khoản đến " + to_User.full_name,
        },
        from_User.device_token
      );

      fcmSend({
        title: "Ewallet",
        body: "Bạn vừa nhận số tiền từ " + from_User.full_name,
      }, to_User.device_token);

      //DETELE OTP DATA
      OTPRepository.delete({ otp: otp });

      return response.status(200).json({
        type: "TRANSFER_TRANSACTION",
        from_Transaction,
      });
    } else if (otp_data.type == "TRANSACTION") {
      const wallet = otp_data.wallet;
      const transaction = otp_data.transaction;
      await WalletRepository.save(wallet);
      await TransactionRepository.save(transaction);

      //PUSH NOTIFICATION

      //DETELE OTP DATA
      OTPRepository.delete({ otp: otp });

      return response.status(200).json({
        type: "TRANSACTION",
        transaction,
      });
    } else if (otp_data.type == "change_password") {
    }
  }
}
