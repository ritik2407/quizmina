import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

@Injectable()
export class TokenManager {
  constructor() { }

  private static readonly ALGORITHM = 'aes-256-cbc';
  private static readonly KEY = Buffer.from(
    process.env.APP_KEY || 'secret-key',
    'hex',
  );
  private static readonly ENCODING = 'utf8';
  private static readonly OUTPUT_ENCODING = 'hex';
  private static readonly DELIMITER = '.';

  public static create(data: object): string {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv(this.ALGORITHM, this.KEY, iv);

      const jsonData = JSON.stringify(data);
      const encrypted = Buffer.concat([
        cipher.update(jsonData, this.ENCODING),
        cipher.final(),
      ]).toString(this.OUTPUT_ENCODING);

      return [
        this.ALGORITHM,
        encrypted,
        iv.toString(this.OUTPUT_ENCODING),
      ].join(this.DELIMITER);
    } catch (error) {
      throw new Error(`Token creation failed: ${error}`);
    }
  }

  public static verify<T = any>(token: string): T | false {
    try {
      const [algorithm, encrypted, ivHex] = token.split(this.DELIMITER);

      if (algorithm !== this.ALGORITHM) {
        throw new Error('Invalid algorithm');
      }

      const iv = Buffer.from(ivHex, this.OUTPUT_ENCODING);
      const decipher = createDecipheriv(algorithm, this.KEY, iv);

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encrypted, this.OUTPUT_ENCODING)),
        decipher.final(),
      ]).toString(this.ENCODING);

      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Token verification failed:', error);
      return false;
    }
  }
}
