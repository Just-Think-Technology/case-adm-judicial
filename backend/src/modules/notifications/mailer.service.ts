// Mailer service — transactional e-mail that never blocks the caller

import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import {
  buildNewDocumentEmail,
  buildPasswordResetEmail,
  buildVerificationEmail,
  type NewDocumentNotice,
  type OutgoingMail,
} from './mailer.templates';
import { requiredEnv } from '../../common/env';

export interface MailRecipient {
  email: string;
  name: string;
}

/**
 * Sends the product e-mails through the configured SMTP. A failed send is
 * logged for the office and swallowed: registration, reset and every future
 * trigger must succeed for the user even when the mail provider is down.
 */
@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private readonly transporter: Transporter;
  private readonly from: string;

  constructor() {
    const host = requiredEnv('SMTP_HOST');
    const port = Number(requiredEnv('SMTP_PORT'));
    const user = process.env.SMTP_USER ?? '';
    const pass = process.env.SMTP_PASS ?? '';
    const fromAddress = process.env.SMTP_FROM ?? 'nao-responda@case.local';
    const fromName = process.env.SMTP_FROM_NAME ?? 'Portal do Credor';
    this.from = `"${fromName}" <${fromAddress}>`;

    // No real delivery in tests: the message is rendered, not sent, and the
    // verification link is logged so the e2e suite can click it like a user.
    this.transporter =
      process.env.NODE_ENV === 'test'
        ? nodemailer.createTransport({ jsonTransport: true })
        : nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: user === '' ? undefined : { user, pass },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
            socketTimeout: 10000,
          });
  }

  async sendVerificationEmail(to: MailRecipient, link: string): Promise<void> {
    await this.send(to, buildVerificationEmail(to.name, link));
  }

  async sendPasswordResetEmail(to: MailRecipient, link: string): Promise<void> {
    await this.send(to, buildPasswordResetEmail(to.name, link));
  }

  /**
   * Alerts the office that a document landed. Like every other trigger, a
   * failed send is logged and swallowed — the uploader keeps their upload.
   */
  async sendNewDocumentEmail(to: MailRecipient, notice: NewDocumentNotice): Promise<void> {
    await this.send(to, buildNewDocumentEmail(notice));
  }

  private async send(to: MailRecipient, mail: OutgoingMail): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to: `"${to.name}" <${to.email}>`,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });

      if (process.env.NODE_ENV === 'test') {
        const link = mail.text.match(/https?:\/\/\S+/)?.[0] ?? '';
        this.logger.log(`test-mail: to=${to.email} link=${link}`);
      }
    } catch (error) {
      // The user action that triggered this mail already succeeded — alert the
      // office through logs instead of failing the request.
      this.logger.warn(`E-mail to ${to.email} failed: ${(error as Error).message}`);
    }
  }
}
