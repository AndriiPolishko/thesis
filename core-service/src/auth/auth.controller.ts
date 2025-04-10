import { Logger, Res, UnauthorizedException,  Controller, Get, UseGuards, Inject, Req } from '@nestjs/common';
import { Response, Request } from 'express';

import { GoogleAuthGuard } from './guards/guards';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { User } from 'src/user/user.types';

@Controller('auth/google')
export class AuthController {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService
  ) {}
  private readonly logger = new Logger(AuthController.name);

  @Get('login')
  @UseGuards(GoogleAuthGuard)
  async login(@Req() req: Request, @Res() res: Response) {
    return {
      status: 'ok'
    }
  }

  @Get('logout')
  @UseGuards(AuthGuard('jwt'))
  async logout(@Req() req: Request, @Res() res: Response) {
    const user = req.user as User;
    const userId = user?.id;

    res.clearCookie('access_token', {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      // secure: true, // uncomment if using https
    });
    res.status(200).json({ message: 'Logged out successfully' });

    this.logger.log(`User ${userId} logged out and cookie cleared`);

    const logoutRedirectUrl = process.env.FE_LOGOUT_REDIRECT || 'http://localhost:5173/login';

    return res.redirect(logoutRedirectUrl);
  }

  @Get('callback')
  @UseGuards(GoogleAuthGuard)
  async redirect(@Req() req, @Res() res) {
    const { user } = req.user;
    // TODO: Save refresh token to DB
    const {accessToken, refreshToken} = await this.authService.login(user);

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      // TODO: uncomment when move to https
      // secure: true,
      // sameSite: 'none',
      path: '/',
      sameSite: 'lax',
      maxAge: 15 * 60 * 1000, // 15 min
    });


    this.logger.log(`Redirecting user: ${user.id}`);

    const feUrl = process.env.FE_URL || 'http://localhost:5173/campaigns/create';

    res.redirect(feUrl);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  getMe(@Req() req) {
    if (!req.user) {
      throw new UnauthorizedException();
    }
  
    this.logger.log(`Returning user `, { user: req.user });

    return req.user;
  }
}
