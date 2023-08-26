import {AppDataSource} from '../config/database.js';
import { User } from '../model/user';

export const UserRepository = AppDataSource.getRepository(User);