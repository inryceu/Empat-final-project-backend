import { Injectable } from '@nestjs/common';

@Injectable()
@Injectable()
export class AuthService {
  async login(user: any) {
    return { accessToken: 'some-token' };
  }

  async validateGoogleUser(profile: any) {
    return { id: profile.id, email: profile.emails[0].value };
  }
}
