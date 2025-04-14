import { Injectable, Inject } from '@nestjs/common';
import { google } from 'googleapis';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserRepository } from '../modules/user/user.repository';
import { IntegrationTokenRepository } from 'src/modules/integrationToken/integration-token.repository';
import { User } from 'src/modules/user/user.types';
import { Request } from 'express';

interface CreateUserEntity {
  firstName: string;
  lastName: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    @Inject(IntegrationTokenRepository) private readonly integrationTokenRepository: IntegrationTokenRepository,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Inject(JwtService) private readonly jwtService: JwtService,
  ) {}

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: '1h',
    });
    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: '7d',
    });

    return {
      accessToken,
      refreshToken
    }
  }

  async registerUser(createUserEntity: CreateUserEntity): Promise<{ user }> {
    try {
      const { accessToken, refreshToken, email } = createUserEntity;



      // TODO: Somehow handle for existing user
      const oauth2Client = new google.auth.OAuth2();
      oauth2Client.setCredentials({
        access_token: accessToken
      });
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const googleProjectId = this.configService.get('GOOGLE_PROJECT_ID');
  
      const watchResponse = await gmail.users.watch({
        userId: 'me',
        requestBody: {
          topicName: `projects/${googleProjectId}/topics/gmail-replies`,
          labelIds: ['INBOX'],
          labelFilterAction: 'include',
        },
      });
      const { data: watchResponseData } = watchResponse;
      const { historyId: history_id, expiration: webhookExpirationTimestamp } = watchResponseData;
      const webhookExpiresAt = new Date(Number(webhookExpirationTimestamp));
      const existingUser = await this.userRepository.findOneByEmail(email);
      if (existingUser) {
        // Check if integration token already exists
        const existingIntegrationToken = await this.integrationTokenRepository.findByEmail(email);
        // TODO: add update integration token
        if (!existingIntegrationToken) {
          this.logger.log(`Creating new integration token for user ${existingUser.id} with email ${email}`);
  
          await this.registerIntegrationToken(existingUser.id, accessToken, refreshToken, email, webhookExpiresAt, history_id);
        }

        return { user: existingUser };
      }

      const newUser = await this.userRepository.createOne(createUserEntity);
      
      // Check if integration token already exists
      const existingIntegrationToken = await this.integrationTokenRepository.findByEmail(email);

      if (!existingIntegrationToken) {
        this.logger.log(`Creating new integration token for user ${newUser.user.id} with email ${email}`);

        await this.registerIntegrationToken(newUser.user.id, accessToken, refreshToken, email, webhookExpiresAt, history_id);
      }

      return { user: newUser };
    } catch (error) {
      console.error('Error registering user:', error);
      
      return null;
    }
  }

  async registerIntegrationToken(userId: number, access_token: string, refreshToken: string, email: string, webhookExpiresAt: Date, history_id: string, expiresAt?: Date ) {
    const createIntegrationTokenEntity = {
      userId,
      access_token,
      refreshToken,
      expiresAt,
      email,
      webhookExpiresAt,
      history_id
    };

    return this.integrationTokenRepository.createOne(createIntegrationTokenEntity);
  }

  async findUser(id: number) {
    return await this.userRepository.findOne(id);
  }
}
