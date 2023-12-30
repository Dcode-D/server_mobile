import {NextFunction, Request, Response} from "express";
import {UserRepository} from "../repository/user_repository";
import {hashSync, verifyPassword} from "../routes/auth/auth_method";
import crypto from "crypto";
import {otpGenerator} from "../method/sms_method";
import {OTPRepository} from "../repository/otp_repository";
import {OTP, OtpType} from "../model/otp";
import {sendSMS} from "../method/sms_method";

export class UserController {
  static async register(
      request: Request,
      response: Response,
      next: NextFunction
  ) {
    try {
      //#region find user
      const phone_number = request.body.phone_number;
      const existing_user = await UserRepository.findOne({
        where: {phone_number: phone_number, active: true},
      });
      if (existing_user) {
        return response.status(409).json({
          message: "User already exists",
          user: {},
          wallet: {},
        });
      }
      //#endregion

      //#region Hash Password
      const salt = crypto.randomBytes(32).toString("hex");
      const password = hashSync(request.body.password, salt);
      //#endregion

      const temp_user = {
        full_name: request.body.full_name,
        password_hash: password.toString("hex"),
        phone_number: phone_number,
        identify_ID: request.body.identify_ID,
        birthday: request.body.birthday,
        salt: salt,
        device_token: request.body.deviceToken
      };

      const createUser = UserRepository.create(temp_user);

      //OTP GENERATION
      const otp = otpGenerator();


      const createOTP = new OTP();
      createOTP.otp = otp;
      createOTP.created_at = new Date();
      createOTP.otp_type = OtpType.REGISTER;
      createOTP.user = createUser;

      await OTPRepository.save(createOTP);
      await UserRepository.save(createUser);

      //SEND OTP
      //sendSMS(otp, phone_number);
      sendSMS(otp, null);

      return response.status(200).json({
        message: "OTP SENT",
        otp_data: {
          otp: createOTP.otp,
          otp_type: createOTP.otp_type,
          created_at: createOTP.created_at
        },
      });
    } catch (error) {
      next(error);
    }

  }

  static async changePassword(
      request: Request,
      response: Response,
      next: NextFunction
  ) {
    try{
      const id = request.params.id;
      const old_password = request.body.old_password;
      const new_password = request.body.new_password;
      const user = await UserRepository.findOne({
        where: {id: id},
      });
      await verifyPassword(
          old_password,
          user.salt,
          user.password_hash,
          async (err, result) => {
            if (!result) {
              return response.status(401).json({
                message: "Wrong password",
              });
            }
            const new_hash_password = hashSync(new_password, user.salt);
            user.password_hash = new_hash_password.toString("hex");
            await UserRepository.save(user);
            return response.status(200).json({
              message: "Password changed",
            });
          }
      );
    }
    catch (e) {
      return response.status(500).json({message: "Internal server error"});
    }

  }

  static async getUser(
      request: Request,
      response: Response,
      next: NextFunction
  ) {
    const id = request.params.id;
    const result = await UserRepository.findOne({
      where: {id: id},
    });
    if (!result) return response.status(404);
    return response.status(200).json({
      id: result.id,
      full_name: result.full_name,
      phone_number: result.phone_number,
    });
  }

  static async getUserByPhoneNumber(
      request: Request,
      response: Response,
      next: NextFunction
  ) {
    try{
      const phone_number = request.params.phone_number;
      const result = await UserRepository.findOne({
        where: {phone_number: phone_number},
        relations: {
          wallets: true,
        },
      });
      if (!result) return response.status(404);
      return response.status(200).json({
        id: result.id,
        full_name: result.full_name,
        phone_number: result.phone_number,
        wallets: result.wallets,
      });
    }
    catch (e) {
      return  response.status(500).json({message: e.message});
    }
  }

  static async getFullUser(
      request: Request,
      response: Response,
      next: NextFunction
  ) {
    try{
      const id = request.params.id;
      const result = await UserRepository.findOne({
        where: {id: id},
      });
      console.log("reached here")
      console.log("result: "+result)
      if (result == null) return response.status(404).json({message: "User not found"});
      return response.status(200).json(result);
    }
    catch (e) {
      return response.status(500).json({message: e.message});
    }
  }

  static async updateUser(
      request: Request,
      response: Response,
      next: NextFunction
  ) {
    try {
      const id = request.params.id;
      const city = request.body.city;
      const job = request.body.job;
      const user = await UserRepository.findOne({
        where: {id: id},
      });
      if (!user) return response.status(404);

      user.city = city;
      user.job = job;

      await UserRepository.save(user);

      return response.status(200).json(user);
    } catch (e) {
      return response.status(500).json({message: e.message});
    }
  }

  static async getAllUsers(
      request: Request,
      response: Response,
  ) {
    try {
      const { page } = request.params;
      const itemsPerPage = 10;

      const users = await UserRepository.find({
        select:["id"],
        skip: (parseInt(page) - 1) * itemsPerPage,
        take: itemsPerPage,
      });

      return response.status(200).json(users);
    } catch (e) {
      return response.status(500).json({ message: e.message });
    }
  }

    static async setUserStatusUser(
        request: Request,
        response: Response,
        next: NextFunction
    ) {
        try {
            const id = request.params.id;
            const user = await UserRepository.findOne({
                where: { id: id },
            });
            const status = request.body.status;
            if (!user) return response.status(404);

            user.active = status;

            await UserRepository.save(user);

            return response.status(200).json(user);
        } catch (e) {
            return response.status(500).json({ message: e.message });
        }
    }

    static  async validateUserPassword(
        request: Request,
        response: Response,
        next: NextFunction){
        try{
            const id = request.user["id"]
            const password = request.body.password;
            const user = await UserRepository.findOne({
                where: {id: id},
            });
            await verifyPassword(
                password,
                user.salt,
                user.password_hash,
                async (err, result) => {
                    if (!result) {
                        return response.status(401).json({
                            message: "Wrong password",
                        });
                    }
                    return response.status(200).json({
                        message: "Password is correct",
                    });
                }
            );
        }
        catch (e) {
            return response.status(500).json({message: "Internal server error"});
        }
    }

}
