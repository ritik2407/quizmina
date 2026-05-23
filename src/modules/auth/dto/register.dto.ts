import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address.' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters.' })
  @MaxLength(100)
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @IsIn(['teacher', 'student'], {
    message: "Role must be 'teacher' or 'student'.",
  })
  role: 'teacher' | 'student';

  /** Student only */
  @IsString()
  @IsOptional()
  @MaxLength(50)
  grade?: string;

  /** Teacher only */
  @IsString()
  @IsOptional()
  @MaxLength(100)
  subject?: string;
}
