import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: false })
  displayName: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({
    default:
      'https://static-00.iconduck.com/assets.00/avatar-icon-2048x2048-ilrgk6vk.png',
  })
  avatar: string;

  @Prop({ default: Date.now() })
  createdAt: Date;

  @Prop({ default: '#ffffff' })
  nicknameColor: string;

  @Prop({ default: 'color/#ffffff' })
  banner: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
