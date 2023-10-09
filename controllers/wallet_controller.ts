import { Response, Request, NextFunction } from "express";
import { Wallet } from "../model/wallet";
import { UserRepository } from "../repository/user_repository";
import { WalletRepository } from "../repository/wallet_repository";

export class WalletController {
  static async createWallet(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    const name = req.body.name;
    const type = req.body.type;
    var card_number = req.body.card_number;

    //#region Check Exist
    const existedWallet = await WalletRepository.findOne({
      where: { card_number: card_number, name: name, type: type },
    });

    if (existedWallet) return res.status(409).json("ExistedWallet");

    const user = await UserRepository.findOne({
      where: {
        id: id,
      },
    });

    if (!user) return res.status(404).json("Can not find user");
    //#endregion

    if (!card_number) {
      card_number = Math.round(Date.now() + Math.random());
    }

    const createWallet = WalletRepository.create({
      balance: 0,
      name: name,
      type: type,
      card_number: card_number,
      user: user,
    });

    const wallet = await WalletRepository.save(createWallet);
    return res.status(200).json({
      wallet,
      user: {
        id: wallet.user.id,
        full_name: wallet.user.full_name,
        phone_number: wallet.user.phone_number,
      }
    });
  }

  static async getUserWallet(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    const wallet = await WalletRepository.findOne({
      where: {
        id: id,
      },
      relations: {
        user: true,
      },
    });
    if (!wallet) return res.status(400).json("Can not find wallet");
    return res.status(200).json({
      id:wallet.user,
      full_name:wallet.user.full_name,
      phone_number:wallet.user.phone_number,
    });
  }

  static async getWallets(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    const user = await UserRepository.findOne({
      where: {
        id: id,
      },
      relations: {
        wallets: true,
      },
    });
    if (!user) return res.status(404).json("Can not find user");
    return res.status(200).json(user.wallets);
  }

  static async updateWallet(req: Request, res: Response, next: NextFunction) {}
}
