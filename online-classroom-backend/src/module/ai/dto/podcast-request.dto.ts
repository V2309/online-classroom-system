import { IsNotEmpty, IsString } from 'class-validator';

export class PodcastRequestDto {
  @IsString()
  @IsNotEmpty()
  session_id: string;
}
