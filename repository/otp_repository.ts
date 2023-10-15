import { AppDataSource } from "../config/database.js";
import { OTP } from "../model/otp.js";

export const OTPRepository = AppDataSource.getRepository(OTP);
