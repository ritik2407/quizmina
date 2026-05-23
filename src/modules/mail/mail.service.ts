import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import * as path from 'path';
import * as ejs from 'ejs';

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/**
 * MailService — wraps Nodemailer with app-configured SMTP credentials.
 * Used for transactional emails: quiz reminders, results, and AI insights.
 * Renders templates dynamically using EJS files.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor() {
    this.from = `"${process.env.SMTP_NAME || 'QuizMinia'}" <${process.env.SMTP_FROM || 'no-reply@quizminia.com'}>`;

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: +(process.env.SMTP_PORT || 1025),
      secure: +(process.env.SMTP_PORT || 1025) === 465,
      auth: {
        user: process.env.SMTP_USERNAME || '',
        pass: process.env.SMTP_PASSWORD || '',
      },
    });
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text ?? options.html.replace(/<[^>]+>/g, ''),
      });
      this.logger.log(`Email sent to ${options.to}: "${options.subject}"`);
      return true;
    } catch (err) {
      this.logger.error(`Failed to send email to ${options.to}: ${err.message}`);
      return false;
    }
  }

  /**
   * Helper to render an EJS email template.
   */
  private async renderTemplate(templateName: string, data: Record<string, any>): Promise<string> {
    const templatePath = path.join(process.cwd(), 'views', 'emails', `${templateName}.ejs`);
    return new Promise((resolve, reject) => {
      ejs.renderFile(templatePath, data, (err, str) => {
        if (err) {
          reject(err);
        } else {
          resolve(str);
        }
      });
    });
  }

  // ─── Templated helpers ────────────────────────────────────────────────────────

  async sendQuizReminder(to: string, name: string, quizTitle: string, scheduledAt: Date): Promise<boolean> {
    try {
      const scheduledAtString = scheduledAt.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
      const html = await this.renderTemplate('quiz-reminder', {
        name,
        quizTitle,
        scheduledAtString,
        appDomain: process.env.APP_DOMAIN || 'http://localhost:3000',
      });

      return await this.sendMail({
        to,
        subject: `⏰ Reminder: "${quizTitle}" starts soon!`,
        html,
      });
    } catch (err) {
      this.logger.error(`Error sending quiz reminder email to ${to}: ${err.message}`);
      return false;
    }
  }

  async sendQuizResult(
    to: string,
    name: string,
    quizTitle: string,
    percentage: number,
    passed: boolean,
    summary: string,
  ): Promise<boolean> {
    try {
      const html = await this.renderTemplate('quiz-result', {
        name,
        quizTitle,
        percentage,
        passed,
        summary,
        appDomain: process.env.APP_DOMAIN || 'http://localhost:3000',
      });

      const emoji = passed ? '✅' : '❌';
      return await this.sendMail({
        to,
        subject: `${emoji} Quiz Result: "${quizTitle}" — ${percentage.toFixed(1)}%`,
        html,
      });
    } catch (err) {
      this.logger.error(`Error sending quiz result email to ${to}: ${err.message}`);
      return false;
    }
  }

  async sendWelcome(to: string, name: string, role: string): Promise<boolean> {
    try {
      const html = await this.renderTemplate('welcome', {
        name,
        role,
        appDomain: process.env.APP_DOMAIN || 'http://localhost:3000',
      });

      return await this.sendMail({
        to,
        subject: `Welcome to QuizMinia, ${name}! 🎉`,
        html,
      });
    } catch (err) {
      this.logger.error(`Error sending welcome email to ${to}: ${err.message}`);
      return false;
    }
  }
}
