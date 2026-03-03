import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateCompanyDto, LoginCompanyDto } from './dto/create-company.dto';

const companyExample = {
  id: '65f1a2b3c4d5e6f7a8b9c0d1',
  name: 'Empat Tech',
  industry: 'IT & Software Development',
  size: '50-200 employees',
  contactName: 'Павло Малуєв',
  email: 'info@empat.tech',
  createdAt: '2026-03-03T10:00:00.000Z',
  updatedAt: '2026-03-03T10:00:00.000Z',
};

export function ApiCreateCompany() {
  return applyDecorators(
    ApiOperation({
      summary: 'Реєстрація нової компанії',
      description: 'Створює новий запис компанії в системі та хешує пароль.',
    }),
    ApiBody({
      type: CreateCompanyDto,
      schema: {
        example: {
          name: 'Empat Tech',
          industry: 'IT',
          size: '100+',
          contactName: 'Павло Малуєв',
          email: 'hr@empat.tech',
          password: 'securePassword123',
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Компанію успішно створено.',
      schema: { example: companyExample },
    }),
    ApiResponse({
      status: 400,
      description: 'Помилка валідації (невірний формат email тощо).',
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
      summary: 'Авторизація компанії',
      description:
        'Перевіряє email/пароль та повертає дані компанії (без пароля).',
    }),
    ApiBody({
      type: LoginCompanyDto,
      schema: {
        example: {
          email: 'hr@empat.tech',
          password: 'securePassword123',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Авторизація успішна.',
      schema: { example: companyExample },
    }),
    ApiResponse({ status: 401, description: 'Невірні облікові дані.' }),
  );
}

export function ApiFindAllCompanies() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Отримати список усіх компаній' }),
    ApiResponse({
      status: 200,
      description: 'Масив компаній успішно отримано.',
      schema: { example: [companyExample] },
    }),
  );
}

export function ApiFindOneCompany() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Отримати дані компанії за ID' }),
    ApiParam({
      name: 'id',
      description: 'Унікальний ідентифікатор компанії (ObjectId)',
      example: '65f1a2b3c4d5e6f7a8b9c0d1',
    }),
    ApiResponse({
      status: 200,
      description: 'Компанію знайдено.',
      schema: { example: companyExample },
    }),
    ApiResponse({ status: 404, description: 'Компанію не знайдено.' }),
  );
}

export function ApiUpdateCompany() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Оновити дані компанії' }),
    ApiParam({ name: 'id', example: '65f1a2b3c4d5e6f7a8b9c0d1' }),
    ApiBody({
      description: 'Поля для оновлення',
      schema: {
        example: {
          industry: 'AI Research',
          contactName: 'Pavlo M.',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Дані успішно оновлено.',
      schema: { example: { ...companyExample, industry: 'AI Research' } },
    }),
    ApiResponse({ status: 404, description: 'Компанію не знайдено.' }),
  );
}

export function ApiDeleteCompany() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Видалити компанію' }),
    ApiParam({ name: 'id', example: '65f1a2b3c4d5e6f7a8b9c0d1' }),
    ApiResponse({
      status: 200,
      description: 'Компанію видалено.',
      schema: { example: { message: 'Company deleted successfully' } },
    }),
    ApiResponse({ status: 404, description: 'Компанію не знайдено.' }),
  );
}
