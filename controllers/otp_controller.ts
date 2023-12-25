import { Response, Request, NextFunction } from "express";
import { otpGenerator, sendSMS, verifyOTP } from "../method/sms_method";
import { OTPRepository } from "../repository/otp_repository";
import { TransactionRepository } from "../repository/transaction_repository";
import { UserRepository } from "../repository/user_repository";
import { WalletRepository } from "../repository/wallet_repository";
import fcmSend from '../controllers/notification_controller';
import {OtpType} from "../model/otp";
import { generateToken } from "../routes/auth/auth_method";
import {AppDataSource} from "../config/database";
import {Wallet} from "../model/wallet";
import {Transaction} from "../model/transaction";
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

        if(!accessToken){
          return response.status(500).json("There was an error, please try again");
        }

        return response.status(201).json({
          type: "REGISTER",
          message: "User created successfully",
          accessToken,
          user: {
            id: saveUser.id,
            full_name: saveUser.full_name,
            phone_number: saveUser.phone_number,
            identify_ID: saveUser.identify_ID,
            devicetoken: saveUser.device_token,
            wallets: saveUser.wallets,
          },         
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
        from_Transaction.status = "Success";
        const to_Transaction = TransactionRepository.create({
          type: OtpType.TRANSFER_TRANSACTION,
          from_User: from_User.id,
          to_User: to_User.id,
          from_Wallet: from_Wallet.id,
          to_Wallet: to_Wallet.id,
          amount: from_Transaction.amount,
          message: from_Transaction.message,
          time: new Date(),
          status: "Success",
          user: to_User,
        });

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        // lets now open a new transaction:
        await queryRunner.startTransaction();
        try {
          await queryRunner.manager.save(Wallet, from_Wallet);
          await queryRunner.manager.save(Wallet,to_Wallet);
          await queryRunner.manager.save(Transaction,from_Transaction);
          await queryRunner.manager.save(Transaction,to_Transaction);
        } catch (err) {
            // since we have errors lets rollback the changes we made
            await queryRunner.rollbackTransaction();
            return response.status(404).json("Transaction failed");
        }
        finally {
            // we need to release a queryRunner which was manually instantiated
            await queryRunner.release();
        }

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
        // const wallet = result.transaction.to_Wallet ? result.transaction.to_Wallet : result.transaction.from_Wallet;
        // const transaction = result.transaction;
        // if(!transaction) return response.status(404).json("Invalid transaction !");
        // if(!wallet) return response.status(404).json("Invalid wallet !");
        // const withWallet = await WalletRepository.findOne({where: {id: wallet}});
        // if(withWallet.balance < transaction.amount) return response.status(404).json("Not enough money !");
        //
        // const payResult = paypalPayout(transaction);
        // return response.status(200).json(payResult);
        // if(!payResult) return response.status(404).json("Paypal payout error !");
        // else{
        //   transaction.status = "Success";
        //   await TransactionRepository.save(transaction);
        //   withWallet.balance = withWallet.balance - transaction.amount;
        //   await WalletRepository.save(withWallet);
        //   //DETELE OTP DATA
        //   // OTPRepository.delete({ otp: otp });
        //   return response.status(200).json({
        //     type: "TRANSACTION",
        //     transaction,
        //     payResult
        //   });
        // }

      } else if (otp.type == OtpType.CHANGE_PASSWORD) {
      } else {
        return response.status(404).json({message: "OTP is not valid type!", otp: result});
      }
    } catch (error) {
      return response.status(404).json({message: "OTP is not valid!"});
    }
  }
}
