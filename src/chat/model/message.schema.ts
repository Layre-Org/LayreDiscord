import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MessageDocument = HydratedDocument<Message>;
export type TempMessageDocument = HydratedDocument<TempMessage>;

@Schema()
export class Message {
  @Prop({ required: true })
  data: [
    {
      content: string;
      author: { type: Types.ObjectId; ref: 'users' };
      sentAt: Date;
      edited: { type: boolean; default: false };
      response: { type: string[]; default: [] };
      attachments: { type: string[]; default: [] };
    },
  ];
}

@Schema()
export class TempMessage {
  @Prop()
  _id: string;

  @Prop({ required: true, default: [] })
  data: [
    {
      content: string;
      author: { type: Types.ObjectId; ref: 'users' };
      sentAt: Date;
      edited: { type: boolean; default: false };
      response: { type: string[]; default: [] };
      attachments: { type: string[]; default: [] };
    },
  ];
}

export const MessageSchema = SchemaFactory.createForClass(Message);
export const TempMessageSchema = SchemaFactory.createForClass(TempMessage);
