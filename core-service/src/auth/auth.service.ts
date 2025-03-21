import { Injectable, Inject } from '@nestjs/common';

import { UserRepository } from '../user/user.repository';
import { IntegrationTokenRepository } from 'src/modules/integrationToken/integration-token.repository';

interface CreateUserEntity {
  firstName: string;
  lastName: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    @Inject(IntegrationTokenRepository) private readonly integrationTokenRepository: IntegrationTokenRepository
  ) {}

  async registerUser(createUserEntity: CreateUserEntity): Promise<{ user }> {
    const { accessToken, refreshToken, email } = createUserEntity;

    const {user: existingUser} = await this.userRepository.findOneByEmail(email);

    if (existingUser) {
      // TODO: add update 

      return { user: existingUser };
    }

    const newUser = await this.userRepository.createOne(createUserEntity);

    await this.registerIntegrationToken(newUser.user.id, accessToken, refreshToken);

    
    return { user: newUser };
  }

  async registerIntegrationToken(userId: number, integrationToken: string, refreshToken: string, expiresAt?: Date) {
    const createIntegrationTokenEntity = {
      userId,
      integrationToken,
      refreshToken,
      expiresAt
    };

    return this.integrationTokenRepository.createOne(createIntegrationTokenEntity);
  }

  async findUser(id: number) {
    return await this.userRepository.findOne(id);
  }
}
