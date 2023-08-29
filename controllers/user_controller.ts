import { Response, Request, NextFunction } from "express";
import { UserRepository } from "../repository/user_repository";
import { hash, hashSync, verifyPassword } from "../routes/auth/auth_method";

export class UserController {
  
  static async register(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    //#region find user
    const phone_number = Number(request.body.phone_number);
    const existing_user = await UserRepository.findOne({
      where: { phone_number: phone_number },
    });
    if (existing_user) {
      return response.json({
        message: "User already exists",
        status_code: 409,
      });
    }
    //#endregion

    //#region Hash Password
    const password = hashSync(request.body.password);
    if (password.err) {
      return response.json({
        message: password.err.message,
        status_code: 500,
      });
    }
    //#endregion

    const temp = UserRepository.create({
      full_name: request.body.full_name,
      password_hash: password.passwordHash.toString("hex"),
      phone_number: request.body.phone_number,
      identify_ID: request.body.identify_ID,
      birthday: request.body.birthday,
      salt: password.salt,
    });
    const user = await UserRepository.save(temp);

    return response.json({
      message: "User created",
      status_code: 201,
      id: user.id,
    });
  }

  static async changePassword(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const phone_number = Number(request.params.phone_number);
    const old_password = request.body.old_password;
    const new_password = request.body.new_password;
    const user = await UserRepository.findOne({
      where: { phone_number: phone_number },
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
        const new_hash_password = hashSync(new_password);
        if (new_hash_password.err) {
          return response.json({
            message: new_hash_password.err.message,
            status_code: 500,
          });
        }
        user.password_hash = new_hash_password.passwordHash.toString("hex");
        await UserRepository.save(user);
        return response.json({
          message: "Password changed",
          status_code: 200,
        });
      }
    );
  }
}
