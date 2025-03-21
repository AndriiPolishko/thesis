import { Injectable, Logger } from "@nestjs/common";
import { PassportSerializer } from "@nestjs/passport";
import { Inject } from "@nestjs/common";

import { AuthService } from "../auth.service";
import { User } from "src/user/user.repository";

@Injectable()
export class SessionSerializer extends PassportSerializer {
  private readonly logger = new Logger('SessionSerializer');
  constructor(
    @Inject(AuthService) private readonly authService: AuthService
  ) {
    super();
  }

  serializeUser(payload: any, done: Function) {
    const { user } = payload;
    this.logger.log(`Serializing user: ${user.id}`, user);

    done(null, user.id);
  }

  async deserializeUser(userId: number, done: Function) {
    const foundUser = await this.authService.findUser(userId);

    this.logger.log(`Deserializing user: ${userId}`);

    return done(null, foundUser || null);
  }
}