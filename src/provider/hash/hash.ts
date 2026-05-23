import { Injectable, Logger } from '@nestjs/common';
import { pbkdf2Sync, randomBytes } from 'crypto';

@Injectable()
export class Hash {
  private static readonly logger = new Logger();
  private static readonly SALT_LENGTH = 32; // Increased for better security
  private static readonly HASH_LENGTH = 64; // 512 bits
  private static readonly ITERATIONS = 1000; // Increased for better security
  private static readonly DIGEST = 'sha512';
  public static make(password: string): string {
    if (!password || typeof password !== 'string') {
      throw new Error('Invalid password provided');
    }

    try {
      const salt = randomBytes(this.SALT_LENGTH).toString('hex');
      const hash = pbkdf2Sync(
        password,
        salt,
        this.ITERATIONS,
        this.HASH_LENGTH,
        this.DIGEST,
      ).toString('hex');

      return `${salt}:${hash}`;
    } catch (error) {
      this.logger.error(error);
      throw new Error('Hash generation failed');
    }
  }

  public static compare(storedHash: string, password: string): boolean {
    if (!storedHash || !password || typeof password !== 'string') {
      return false;
    }

    try {
      const [salt, originalHash] = storedHash.split(':');

      if (!salt || !originalHash) {
        return false;
      }

      const hash = pbkdf2Sync(
        password,
        salt,
        this.ITERATIONS,
        this.HASH_LENGTH,
        this.DIGEST,
      ).toString('hex');

      // Constant-time comparison to prevent timing attacks
      return Buffer.from(hash).equals(Buffer.from(originalHash));
    } catch (error) {
      console.error('Hash comparison failed:', error);
      return false;
    }
  }
}
