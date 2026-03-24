import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

import { LoginDto, GoogleMobileLoginDto } from './dto/login-employee.dto';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { LoginCompanyDto } from './dto/login-company.dto';

export function ApiGoogleAuth() {
  return applyDecorators(
    ApiOperation({
      summary: 'Ініціалізація Google OAuth (Тільки вхід)',
      description:
        'Перенаправляє користувача на сторінку вибору акаунта Google. Увага: працює тільки для вже зареєстрованих акаунтів (співробітників або компаній).',
    }),
    ApiResponse({ status: 302, description: 'Успішний редирект на Google.' }),
  );
}

export function ApiGoogleAuthCallback() {
  return applyDecorators(
    ApiOperation({
      summary: 'Google OAuth Колбек',
      description:
        'Сюди Google повертає користувача після успішної авторизації.',
    }),
    ApiResponse({
      status: 302,
      description: 'Редирект на FRONTEND_URL з JWT токеном.',
    }),
    ApiResponse({
      status: 401,
      description: 'Акаунт з таким email не знайдено.',
    }),
  );
}

export function ApiRegisterEmployee() {
  return applyDecorators(
    ApiOperation({
      summary: 'Завершення реєстрації співробітника',
      description:
        'Працівник передає token (з email-запрошення), свій пароль та особисті дані.',
    }),
    ApiBody({
      type: RegisterEmployeeDto,
      description: 'Дані для реєстрації',
      schema: {
        example: {
          token:
            '74f817d8b0c446aa738fbcedc601c292199888ea101c202da6558ec9e890e805',
          password: 'Password123!',
          gender: 'female',
          hobbies: 'Читання, Подорожі',
          favoriteAnimal: 'Кіт',
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Успішна реєстрація. Повертає JWT.',
    }),
    ApiResponse({ status: 400, description: 'Помилка валідації.' }),
    ApiResponse({ status: 403, description: 'Недійсний токен.' }),
    ApiResponse({ status: 409, description: 'Співробітник вже існує.' }),
  );
}

export function ApiLoginEmployee() {
  return applyDecorators(
    ApiOperation({
      summary: 'Вхід співробітника',
      description: 'Вхід за email та паролем.',
    }),
    ApiBody({
      type: LoginDto,
      schema: {
        example: {
          email: 'employee@techcorp.com',
          password: 'Password123!',
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Успішний вхід. Повертає JWT токен.',
    }),
    ApiResponse({ status: 401, description: 'Невірний email або пароль.' }),
  );
}

export function ApiRegisterCompany() {
  return applyDecorators(
    ApiOperation({
      summary: 'Реєстрація нової компанії',
      description: 'Відкрита реєстрація для нових компаній (B2B).',
    }),
    ApiBody({
      type: RegisterCompanyDto,
      schema: {
        example: {
          name: 'Tech Corp',
          industry: 'IT',
          size: '51-200',
          contactName: 'John Doe',
          email: 'company@techcorp.com',
          password: 'Password123!',
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Компанію успішно зареєстровано.',
    }),
    ApiResponse({ status: 400, description: 'Помилка валідації.' }),
    ApiResponse({
      status: 409,
      description: 'Компанія з таким email вже існує.',
    }),
  );
}

export function ApiLoginCompany() {
  return applyDecorators(
    ApiOperation({
      summary: 'Вхід компанії',
      description: 'Вхід за email та паролем для компанії.',
    }),
    ApiBody({
      type: LoginCompanyDto,
      schema: {
        example: {
          email: 'company@techcorp.com',
          password: 'Password123!',
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Успішний вхід. Повертає JWT токен.',
    }),
    ApiResponse({ status: 401, description: 'Невірні дані для входу.' }),
  );
}

export function ApiGetProfile() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Отримати профіль поточного користувача/компанії',
    }),
    ApiResponse({ status: 200, description: 'Профіль успішно отримано.' }),
    ApiResponse({ status: 401, description: 'Неавторизовано.' }),
  );
}
