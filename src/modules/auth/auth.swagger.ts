import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserProfileDto } from '../users/dto/user-profile.dto';

export function ApiGoogleAuth() {
  return applyDecorators(
    ApiOperation({
      summary: 'Ініціалізація Google OAuth',
      description:
        'Перенаправляє користувача на сторінку вибору акаунта Google.',
    }),
    ApiResponse({ status: 302, description: 'Успішний редирект на Google.' }),
  );
}

export function ApiGoogleAuthCallback() {
  return applyDecorators(
    ApiOperation({
      summary: 'Google OAuth Колбек',
      description:
        'Сюди Google повертає користувача. Бекенд генерує JWT і редиректить на фронтенд.',
    }),
    ApiResponse({
      status: 302,
      description: 'Редирект на FRONTEND_URL з JWT токеном у параметрах.',
    }),
    ApiResponse({
      status: 401,
      description: 'Помилка авторизації з боку Google.',
    }),
  );
}

export function ApiGetCurrentUser() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Отримати профіль поточного користувача',
      description:
        'Повертає дані користувача на основі переданого Bearer токена.',
    }),
    ApiResponse({
      status: 200,
      description: 'Профіль успішно отримано.',
      type: UserProfileDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Неавторизовано (відсутній або невалідний токен).',
    }),
  );
}
