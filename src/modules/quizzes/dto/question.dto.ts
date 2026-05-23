import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsJSON,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class QuestionOptionDto {
  @IsString()
  label: string;

  @IsString()
  text: string;
}

export class CreateQuestionDto {
  @IsString()
  text: string;

  @IsEnum(['multiple_choice', 'true_false', 'short_answer'])
  @IsOptional()
  type?: 'multiple_choice' | 'true_false' | 'short_answer';

  @IsEnum(['easy', 'medium', 'hard'])
  @IsOptional()
  difficulty?: 'easy' | 'medium' | 'hard';

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  difficultyScore?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];

  @IsString()
  correctAnswer: string;

  @IsString()
  @IsOptional()
  explanation?: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Max(10)
  points?: number;

  @IsInt()
  @IsOptional()
  orderIndex?: number;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  tags?: string[];
}

export class UpdateQuestionDto extends CreateQuestionDto {}
