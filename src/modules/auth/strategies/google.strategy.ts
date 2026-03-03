import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['email', 'profile'],
    });
  }

  async validate(at: string, rt: string, profile: any, done: VerifyCallback) {
    try {
      console.log('--- GOOGLE PROFILE ---', JSON.stringify(profile, null, 2));

      const user = await this.authService.validateGoogleUser(profile);
      
      done(null, user);
    } catch (error) {
      console.error('КРИТИЧНА ПОМИЛКА В GOOGLE STRATEGY:', error);
      done(error, false);
    }
  }
}
