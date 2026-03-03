import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UserProfileDto } from '../users/dto/user-profile.dto';
import { RegisterDto, LoginDto } from './dto/auth.dto';

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

export function ApiRegisterUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Реєстрація за email та паролем',
      description:
        "Створює новий акаунт користувача з email, паролем та ім'ям.",
    }),
    ApiBody({ type: RegisterDto }),
    ApiResponse({
      status: 201,
      description: 'Користувача успішно зареєстровано. Повертає JWT токен.',
    }),
    ApiResponse({
      status: 400,
      description:
        'Помилка валідації вхідних даних (невірний email, закороткий пароль тощо).',
    }),
    ApiResponse({
      status: 409,
      description: 'Користувач з таким email вже існує.',
    }),
  );
}

export function ApiLoginUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Вхід за email та паролем',
      description: 'Перевіряє облікові дані та повертає JWT токен доступу.',
    }),
    ApiBody({ type: LoginDto }),
    ApiResponse({
      status: 201,
      description: 'Успішний вхід. Повертає JWT токен.', // POST за замовчуванням повертає 201 у NestJS
    }),
    ApiResponse({
      status: 400,
      description: 'Помилка валідації вхідних даних.',
    }),
    ApiResponse({
      status: 401,
      description:
        'Невірний email або пароль, або акаунт створено через Google.',
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
