import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateQuizDto {
  @IsString()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  subject?: string;

  @IsEnum(['easy', 'medium', 'hard'])
  @IsOptional()
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(300)
  timeLimit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  passingScore?: number;

  @IsBoolean()
  @IsOptional()
  isAdaptive?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;

  @IsString()
  @IsOptional()
  scheduledAt?: string;

  @IsBoolean()
  @IsOptional()
  generateAiQuestions?: boolean;

  @IsString()
  @IsOptional()
  aiQuestionType?: string;
}

export class UpdateQuizDto extends CreateQuizDto {}

