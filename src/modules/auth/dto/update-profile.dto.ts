import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  avatar?: string;

  @IsString()
  @IsOptional()
  bio?: string;

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

  /** Change password — requires currentPassword */
  @IsString()
  @IsOptional()
  @MinLength(6)
  @MaxLength(100)
  currentPassword?: string;

  @IsString()
  @IsOptional()
  @MinLength(8, { message: 'New password must be at least 8 characters.' })
  @MaxLength(100)
  newPassword?: string;
}
