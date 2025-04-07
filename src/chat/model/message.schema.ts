import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;

@Schema()
export class Message {
  @Prop({ required: true })
  data: [
    {
      content: string;
      author: { type: Types.ObjectId; ref: 'users' };
      sentAt: Date;
    },
  ];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
