import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';

const companyExample = {
  id: '65f1a2b3c4d5e6f7a8b9c0d1',
  name: 'Tech Corp',
  industry: 'IT',
  size: '51-200',
  contactName: 'John Doe',
  email: 'company@techcorp.com',
  departments: ['Engineering', 'Sales'],
  createdAt: '2026-03-05T10:00:00.000Z',
  updatedAt: '2026-03-05T10:00:00.000Z',
};

export function ApiFindAllCompanies() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Отримати список усіх компаній' }),
    ApiResponse({ status: 200, schema: { example: [companyExample] } }),
  );
}

export function ApiFindOneCompany() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Отримати дані компанії за ID' }),
    ApiParam({ name: 'id', example: '65f1a2b3c4d5e6f7a8b9c0d1' }),
    ApiResponse({ status: 200, schema: { example: companyExample } }),
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
          name: 'Tech Corp Updated',
          size: '200-500',
        },
      },
    }),
    ApiResponse({
      status: 200,
      schema: { example: { ...companyExample, name: 'Tech Corp Updated' } },
    }),
  );
}

export function ApiDeleteCompany() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Видалити компанію' }),
    ApiParam({ name: 'id', example: '65f1a2b3c4d5e6f7a8b9c0d1' }),
    ApiResponse({
      status: 200,
      schema: { example: { message: 'Company deleted successfully' } },
    }),
  );
}

export function ApiInviteEmployee() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Створити запрошення для співробітника',
      description:
        'Зберігає дані майбутнього співробітника у "whitelist" та генерує токен.',
    }),
    ApiBody({
      description: 'Дані працівника (whitelist)',
      schema: {
        example: {
          email: 'employee@techcorp.com',
          name: 'Jane Smith',
          department: 'Engineering',
          role: 'middle',
        },
      },
    }),
    ApiResponse({
      status: 201,
      schema: {
        example: {
          message: 'Запрошення успішно створено',
          inviteLink:
            'http://localhost:8080/register-employee?token=74f817d8b0c446aa738fbcedc601c292199888ea101c202da6558ec9e890e805',
        },
      },
    }),
  );
}

export function ApiGetDepartments() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Отримати список відділів поточної компанії' }),
    ApiResponse({
      status: 200,
      schema: {
        example: ['Engineering', 'Sales', 'HR'],
      },
    }),
  );
}

export function ApiAddDepartment() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Додати новий відділ для компанії' }),
    ApiBody({
      description: 'Дані для створення нового відділу',
      schema: {
        example: {
          name: 'Marketing',
        },
      },
    }),
    ApiResponse({
      status: 201,
      schema: {
        example: {
          message: 'Відділ успішно додано',
          departments: ['Engineering', 'Sales', 'Marketing'],
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Відділ з такою назвою вже існує у компанії',
    }),
  );
}
