import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateCompanyDto } from './dto/create-company.dto';

const companyExample = {
  id: '65f1a2b3c4d5e6f7a8b9c0d1',
  name: 'Empat Tech',
  industry: 'IT & Software Development',
  size: '50-200 employees',
  contactName: 'Павло Малуєв',
  email: 'info@empat.tech',
  createdAt: '2026-03-05T10:00:00.000Z',
  updatedAt: '2026-03-05T10:00:00.000Z',
};

export function ApiFindAllCompanies() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Отримати список усіх компаній' }),
    ApiResponse({
      status: 200,
      description: 'Масив компаній успішно отримано.',
      schema: { example: [companyExample] },
    }),
    ApiResponse({ status: 401, description: 'Неавторизовано.' }),
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
    ApiResponse({ status: 401, description: 'Неавторизовано.' }),
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
    ApiResponse({ status: 401, description: 'Неавторизовано.' }),
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
    ApiResponse({ status: 401, description: 'Неавторизовано.' }),
    ApiResponse({ status: 404, description: 'Компанію не знайдено.' }),
  );
}

export function ApiInviteEmployee() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Запросити співробітника',
      description:
        'Генерує JWT токен запрошення для вказаної електронної пошти. Доступно тільки для акаунтів з типом "company".',
    }),
    ApiBody({
      description: 'Email майбутнього співробітника',
      schema: { example: { email: 'new.employee@empat.tech' } },
    }),
    ApiResponse({
      status: 201,
      description: 'Запрошення успішно створено.',
      schema: {
        example: {
          message: 'Запрошення створено',
          inviteLink:
            'https://your-frontend.com/register-employee?token=eyJhbG...&email=new.employee@empat.tech',
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Неавторизовано.' }),
    ApiResponse({
      status: 403,
      description: 'Заборонено. Тільки компанії можуть створювати запрошення.',
    }),
  );
}
