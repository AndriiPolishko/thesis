import { Logger, UnauthorizedException } from '@nestjs/common';
import { Controller, Get, Request, Response, UseGuards } from '@nestjs/common';

import { GoogleAuthGuard } from './guards/guards';

@Controller('auth/google')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  @Get('login')
  @UseGuards(GoogleAuthGuard)
  async login() {
    return {
      message: 'Login'
    }
  }

  @Get('redirect')
  @UseGuards(GoogleAuthGuard)
  async redirect(@Request() req, @Response() res) {
    const user = req.user;

    this.logger.log(`Redirecting user: ${user.id}`);

    const feUrl = process.env.FE_URL || 'http://localhost:5173/campaigns/create';

    res.redirect(feUrl);
  }

  @Get('me')
  getMe(@Request() req) {
    if (!req.user) {
      throw new UnauthorizedException();
    }
  
    this.logger.log(`Returning user `, { user: req.user });

    return req.user; // Will have user info
  }
}
