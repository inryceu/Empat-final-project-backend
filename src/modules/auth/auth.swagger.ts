import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';

import { LoginDto, GoogleMobileLoginDto } from './dto/auth.dto';
import { RegisterEmployeeDto } from './dto/register-employee.dto';
import { RegisterCompanyDto } from './dto/register-company.dto';
import { LoginCompanyDto } from '../companies/dto/create-company.dto';

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
      description:
        'Редирект на FRONTEND_URL з JWT токеном (або повернення JSON, залежно від вашої реалізації).',
    }),
    ApiResponse({
      status: 401,
      description:
        'Акаунт з таким email не знайдено (користувач не зареєстрований).',
    }),
  );
}

export function ApiGoogleAuthMobile() {
  return applyDecorators(
    ApiOperation({
      summary: 'Google Авторизація для мобільних додатків',
      description:
        'Приймає idToken від мобільного додатка, верифікує його і повертає JWT бекенда. Тільки для входу.',
    }),
    ApiBody({ type: GoogleMobileLoginDto }),
    ApiResponse({
      status: 201,
      description: 'Успішна авторизація. Повертає accessToken та профіль.',
    }),
    ApiResponse({
      status: 401,
      description: 'Невалідний Google токен або акаунт не знайдено.',
    }),
  );
}

export function ApiRegisterEmployee() {
  return applyDecorators(
    ApiOperation({
      summary: 'Реєстрація співробітника (за інвайтом)',
      description:
        "Створює акаунт співробітника. Обов'язково вимагає валідний inviteToken, згенерований компанією.",
    }),
    ApiBody({ type: RegisterEmployeeDto }),
    ApiResponse({
      status: 201,
      description: 'Співробітника успішно зареєстровано. Повертає JWT токен.',
    }),
    ApiResponse({
      status: 400,
      description: 'Помилка валідації вхідних даних.',
    }),
    ApiResponse({
      status: 403,
      description:
        'Недійсний, прострочений токен запрошення, або email не співпадає.',
    }),
    ApiResponse({
      status: 409,
      description: 'Співробітник з таким email вже існує.',
    }),
  );
}

export function ApiLoginEmployee() {
  return applyDecorators(
    ApiOperation({
      summary: 'Вхід співробітника',
      description: 'Вхід за email та паролем для співробітників.',
    }),
    ApiBody({ type: LoginDto }),
    ApiResponse({
      status: 201,
      description: 'Успішний вхід. Повертає JWT токен.',
    }),
    ApiResponse({
      status: 401,
      description: 'Невірний email, пароль, або акаунт створено через Google.',
    }),
  );
}

export function ApiRegisterCompany() {
  return applyDecorators(
    ApiOperation({
      summary: 'Реєстрація нової компанії',
      description: 'Відкрита реєстрація для нових компаній (B2B).',
    }),
    ApiBody({ type: RegisterCompanyDto }),
    ApiResponse({
      status: 201,
      description: 'Компанію успішно зареєстровано. Повертає JWT токен.',
    }),
    ApiResponse({
      status: 400,
      description: 'Помилка валідації вхідних даних.',
    }),
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
      description: 'Вхід за email та паролем для представників компанії.',
    }),
    ApiBody({ type: LoginCompanyDto }),
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
      description:
        'Повертає дані профілю на основі переданого Bearer JWT токена. Автоматично визначає тип (компанія чи співробітник).',
    }),
    ApiResponse({ status: 200, description: 'Профіль успішно отримано.' }),
    ApiResponse({
      status: 401,
      description: 'Неавторизовано (відсутній або невалідний токен).',
    }),
  );
}
