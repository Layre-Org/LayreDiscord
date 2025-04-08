import { UUID } from 'crypto';

export class UpdateMessageDataDto {
  id: UUID;
  message: string;
}
