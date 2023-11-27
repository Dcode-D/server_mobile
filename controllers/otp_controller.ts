import { Response, Request, NextFunction } from "express";
import { otpGenerator, sendSMS, verifyOTP } from "../method/sms_method";
import { OTPRepository } from "../repository/otp_repository";
import { TransactionRepository } from "../repository/transaction_repository";
import { UserRepository } from "../repository/user_repository";
import { WalletRepository } from "../repository/wallet_repository";
import fcmSend from '../controllers/notification_controller';
import {OtpType} from "../model/otp";
import { generateToken } from "../routes/auth/auth_method";
export class OTPController {
  static async verifyOTPRequest(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    try {


      const otp = request.body.otp;
      const phone_number = request.body.phone_number;

      const result = await verifyOTP(otp, phone_number);
      if (!result) {
        return response.status(404).json("OTP is not valid!");
      }
      console.log(result);
      if (result.otp_type == OtpType.REGISTER) {

        const saveUser = await UserRepository.findOne({where: {id: result.user.id}})
        if(!saveUser||saveUser.active) return response.status(404).json("Invalid user !");
        saveUser.active = true;

        const createDefaultWallet = WalletRepository.create({
          balance: 0,
          name: "DefaultWallet",
          type: "DefaultWallet",
          card_number: "",
          user: saveUser,
        });
        const saveWallet = await WalletRepository.save(createDefaultWallet);

        saveUser.wallets = [saveWallet];
        await UserRepository.save(saveUser);
        //DETELE OTP DATA
        // OTPRepository.delete({ otp: otp });

        const payload = {
          sub: saveUser.id,
          iat: Math.floor(Date.now() / 1000),
        };
        const accessToken = await generateToken(payload, process.env.SECRET_KEY);

        return response.status(201).json({
          type: "REGISTER",
          message: "User created successfully",
          user: {
            id: saveUser.id,
            full_name: saveUser.full_name,
            phone_number: saveUser.phone_number,
          },
          accessToken
        });
      } else if (result.otp_type == OtpType.TRANSFER_TRANSACTION) {
        const from_Transaction = await TransactionRepository.findOne({
          where: {id: result.transaction.id},
        })
        const to_W = from_Transaction.to_Wallet;
        const from_W = from_Transaction.from_Wallet;

        const from_Wallet = await WalletRepository.findOne({
          where: {id: from_W},
        })

        const to_Wallet = await WalletRepository.findOne({
          where: {id: to_W},
        })

        const from_User = await UserRepository.findOne({
          where: {id: from_Wallet.user.id}
        })

        const to_User = await UserRepository.findOne({
          where: {id: to_Wallet.user.id},
        });

        from_Wallet.balance = Number(from_Wallet.balance) - from_Transaction.amount;
        to_Wallet.balance = Number(to_Wallet.balance) + from_Transaction.amount;
        if (from_Wallet.balance < 0) {
          return response.status(404).json("Not enough money");
        }
        from_Transaction.status = "COMPLETED";
        await WalletRepository.save(from_Wallet);
        await WalletRepository.save(to_Wallet);
        await TransactionRepository.save(from_Transaction);

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
        // OTPRepository.delete({ otp: otp });

        return response.status(200).json({
          type: "TRANSFER_TRANSACTION",
          from_Transaction,
        });
      } else if (result.otp_type == OtpType.TRANSACTION) {
        const wallet = result.transaction.to_Wallet ? otp.to_Wallet : otp.from_Wallet;
        const transaction = result.transaction;
        //if the transaction is received, add money to bank account
        if (transaction.to_Wallet) {
          // has receiver
          const to_Wallet = await WalletRepository.findOne({
            where: {id: transaction.to_Wallet},
          })
          to_Wallet.balance = Number(to_Wallet.balance) + transaction.amount;
          await WalletRepository.save(to_Wallet);
        }
        //else if the transaction is deposit, subtract money from bank account
        else if (transaction.from_Wallet) {
          // has sender
          const from_Wallet = await WalletRepository.findOne({
            where: {id: transaction.from_Wallet},
          })
          //check if the account has that much money
          from_Wallet.balance = Number(from_Wallet.balance) - transaction.amount;
          if (from_Wallet.balance < 0) {
            return response.status(404).json("Not enough money");
          }
          await WalletRepository.save(from_Wallet);
        }
        await WalletRepository.save(wallet);
        transaction.status = "COMPLETED";
        await TransactionRepository.save(transaction);

        //PUSH NOTIFICATION

        //DETELE OTP DATA
        // OTPRepository.delete({ otp: otp });

        return response.status(200).json({
          type: "TRANSACTION",
          transaction,
        });
      } else if (otp.type == OtpType.CHANGE_PASSWORD) {
      } else {
        return response.status(404).json({message: "OTP is not valid type!", otp: result});
      }
    } catch (error) {
      return response.status(404).json(error);
    }
  }
}
