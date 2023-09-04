import { Response, Request, NextFunction } from "express";
import { UserRepository } from "../repository/user_repository";
import { hash, hashSync, verifyPassword } from "../routes/auth/auth_method";
import crypto from "crypto";
import { WalletRepository } from "../repository/wallet_repository";
export class UserController {
  static async register(
    request: Request,
    response: Response,
    next: NextFunction
  ) {

    //#region find user
    const id = request.body.id;
    const existing_user = await UserRepository.findOne({
      where: { id: id },
    });
    if (existing_user) {
      return response.json({
        message: "User already exists",
        status_code: 409,
      });
    }
    //#endregion

    //#region Hash Password
    const salt = crypto.randomBytes(32).toString("hex");
    const password = hashSync(request.body.password, salt);
    //#endregion

    const createUser = UserRepository.create({
      full_name: request.body.full_name,
      password_hash: password.toString("hex"),
      id: request.body.id,
      identify_ID: request.body.identify_ID,
      birthday: request.body.birthday,
      salt: salt,
    });

    const createDefaultWallet = WalletRepository.create({
      balance: 0,
      name: "DefaultWallet",
      type: "DefaultWallet",
      card_number: "",
      user: createUser
    })

    const user = await UserRepository.save(createUser);
    const wallet = await WalletRepository.save(createDefaultWallet);

    return response.json({
      message: "User created",
      status_code: 201,
      user,
      wallet
    });
  }

  static async changePassword(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const id = request.params.id;
    const old_password = request.body.old_password;
    const new_password = request.body.new_password;
    const user = await UserRepository.findOne({
      where: { id: id },
    });
    await verifyPassword(
      old_password,
      user.salt,
      user.password_hash,
      async (err, result) => {
        if (!result) {
          return response.json({
            message: "Wrong password",
            status_code: 401,
          });
        }
        const new_hash_password = hashSync(new_password, user.salt);
        user.password_hash = new_hash_password.toString("hex");
        await UserRepository.save(user);
        return response.json({
          message: "Password changed",
          status_code: 200,
        });
      }
    );
  }

  static async getUser(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const id = request.params.id;
    const result = await UserRepository.findOne({
      where: {id: id}
    })
    return response.json(result);
  }
}
