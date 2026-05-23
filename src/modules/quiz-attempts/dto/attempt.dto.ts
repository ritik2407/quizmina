import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class StartAttemptDto {
  @IsInt()
  @Min(1)
  quizId: number;
}

export class SubmitAnswerDto {
  @IsInt()
  @Min(1)
  questionId: number;

  @IsString()
  @IsNotEmpty()
  answer: string;

  /** Seconds spent on this question */
  @IsInt()
  @IsOptional()
  @Min(0)
  timeTaken?: number;
}
