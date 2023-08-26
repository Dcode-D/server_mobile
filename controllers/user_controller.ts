import { Response, Request, NextFunction } from "express";
import {UserRepository} from "../repository/user_repository";

export class UserController {
  static async register(request: Request, response: Response, next: NextFunction) {
    const username = request.body.username;
    const temp = UserRepository.create({
        full_name: request.body.full_name,
        password_hash: request.body.password_hash,
        phone_number: request.body.phone_number,
        identify_ID: request.body.identify_ID,
        birthday: request.body.birthday,
    }
    )
    const user = await UserRepository.save(temp);
    return response.json({
        message:'User created',
        status_code: 201,
        id: user.id,
    })
  }
}
