import axios from 'axios';
import { Logger } from '@nestjs/common';
import { Injectable } from "@nestjs/common";
import { google } from 'googleapis';

@Injectable()
export class GmailClientUtil {
  private readonly logger = new Logger(GmailClientUtil.name);

  async refreshAccessToken(refreshToken: string) {
    try {
      const params = {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }
      const res = await axios.post('https://oauth2.googleapis.com/token', null, {
        params
      });
  
      return {
        accessToken: res.data.access_token,
        refreshToken: refreshToken,
        expiresAt: new Date(Date.now() + res.data.expires_in * 1000),
      };
    } catch (error) {
      this.logger.error('Error refreshing token', {
        error
      });
    }
    
  }

  async sendEmail({ access_token, refresh_token, to, subject, body }: {
    access_token: string;
    refresh_token: string;
    to: string;
    subject: string;
    body: string;
  }) {
    try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({
      access_token,
      // refresh_token, // optional but good
      // expiry_date: Date.now() + 3600 * 1000, // optional but good
    });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const encodedMessage = Buffer.from([
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      body
    ].join('\n')).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage,
      },
    });
    } catch (error) {
      this.logger.error('Error sending email', { error });
    }
  }
}
