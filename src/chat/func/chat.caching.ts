import { UUID } from 'crypto';
import { Types } from 'mongoose';

const MessagesCacheArray: {
  content: string;
  author: string | Types.ObjectId;
  id: UUID;
  sentAt: Date | number;
  edited: boolean;
}[] = [];

function get() {
  return MessagesCacheArray;
}

function push(data: {
  content: string;
  author: string | Types.ObjectId;
  id: UUID;
  sentAt: Date | number;
  edited: boolean;
}) {
  MessagesCacheArray.push(data);
}

function length() {
  return MessagesCacheArray.length;
}

function clean() {
  MessagesCacheArray.length = 0;
}

function update(id: UUID, newMessage: string, userId: Types.ObjectId | string) {
  let count = 0;
  let updated = false;
  get().forEach((messageElement) => {
    if (messageElement.id == id && messageElement.author.toString() == userId) {
      const newObject = {
        id: messageElement.id,
        author: messageElement.author.toString(),
        content: newMessage,
        sentAt: messageElement.sentAt,
        edited: true,
      };
      MessagesCacheArray[count] = newObject;
      updated = true;
    }
    count += 1;
  });
  return updated;
}

function del(id: UUID, userId: string | Types.ObjectId) {
  let count = 0;
  let deleted = false;
  get().forEach((messageElement) => {
    if (messageElement.id == id && messageElement.author.toString() == userId) {
      MessagesCacheArray.splice(count, 1);
      deleted = true;
    }
    count += 1;
  });
  return deleted;
}

export { get, push, length, clean, update, del };
