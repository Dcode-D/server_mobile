import { Response, Request, NextFunction } from "express";
import { otpGenerator, sendSMS, verifyOTP } from "../method/sms_method";
import { OTPRepository } from "../repository/otp_repository";
import { TransactionRepository } from "../repository/transaction_repository";
import { UserRepository } from "../repository/user_repository";
import { WalletRepository } from "../repository/wallet_repository";

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
    if (otp_data.type == "register") {
      const user = otp_data.user;
      const wallet = otp_data.wallet;

      const saveUser = UserRepository.save(user);
      const saveWallet = WalletRepository.save(wallet);

      //DETELE OTP DATA
      OTPRepository.delete({otp:otp});

      return response.status(201).json({
        message: "User created successfully",
        user: saveUser,
        wallet: saveWallet,
      });
    } else if (otp_data.type == "transfer_transaction") {
      const to_Wallet = otp_data.to_Wallet;
      const from_Wallet = otp_data.from_Wallet;
      const from_Transaction = otp_data.from_Transaction;
      const to_Transaction = otp_data.to_Transaction;

      await WalletRepository.save([to_Wallet, from_Wallet]);
      await TransactionRepository.save([to_Transaction, from_Transaction]);

      //PUSH NOTIFICATION

      //DETELE OTP DATA
      OTPRepository.delete({ otp: otp });

      return response.status(200).json({
        from_Transaction,
      });
    } else if (otp_data.type == "transaction") {
      const from_Wallet = otp_data.from_Wallet;
      const transaction = otp_data.transaction;
      await WalletRepository.save(from_Wallet);
      await TransactionRepository.save(transaction);

      //PUSH NOTIFICATION

      //DETELE OTP DATA
      OTPRepository.delete({ otp: otp });

      return response.status(201).json(transaction);
    } else if (otp_data.type =="change_password"){
      
    }
  }
}
