import { AppDataSource } from "../config/database.js";
import { Promotion } from "../model/promotion.js";

export const PromotionRepository = AppDataSource.getRepository(Promotion);
