/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { User } from './model/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dtos/create-user.dto';
import { UpdateUserDto } from './dtos/update-user.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  findById(id: string | Types.ObjectId) {
    return this.userModel.findById(id);
  }

  findAuth(email: string) {
    return this.userModel.findOne({ email }).select('+password');
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  findByUsername(username: string) {
    return this.userModel.findOne({ username });
  }

  async create(body: CreateUserDto) {
    try {
      const user: { password?: string } = (
        await this.userModel.create(body)
      ).toObject();
      //const newUser = { ...user } as Partial<CreateUserDto>;
      delete user['password'];
      return user;
    } catch (err) {
      switch (err.code) {
        case 11000:
          console.log(err);
          throw new HttpException(
            `This ${Object.keys(err.keyPattern as Record<string, unknown>)[0]} already exists.`,
            HttpStatus.BAD_REQUEST,
          );
          break;

        default:
          throw new InternalServerErrorException(err.message);
          break;
      }
    }
  }

  async update(id: Types.ObjectId | string, body: UpdateUserDto) {
    if (body['password']) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
      body['password'] = await hash(body['password'], 10);
    }

    return await this.userModel.findOneAndUpdate({ _id: id }, body);
  }

  delete(id: Types.ObjectId | string) {
    return this.userModel.findOneAndDelete({ _id: id });
  }
}
