import { UUID } from 'crypto';
import { Types } from 'mongoose';

const MessagesCacheArray: {
  content: string;
  author: string | Types.ObjectId;
  id: UUID;
}[] = [];

function get() {
  return MessagesCacheArray;
}

function push(data: {
  content: string;
  author: string | Types.ObjectId;
  id: UUID;
  sentAt: Date | number;
}) {
  MessagesCacheArray.push(data);
}

function length() {
  return MessagesCacheArray.length;
}

function clean() {
  MessagesCacheArray.length = 0;
}

export { get, push, length, clean };
