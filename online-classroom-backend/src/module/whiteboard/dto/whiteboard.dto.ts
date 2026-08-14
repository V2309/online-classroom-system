import { IsNotEmpty } from 'class-validator';

export class SaveWhiteboardDto {
  @IsNotEmpty()
  content: any;
}
