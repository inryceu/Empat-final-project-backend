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

export function ApiUpdateEmployee() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({
      summary: 'Оновити дані співробітника або запрошення (лише для компанії)',
      description:
        'Дозволяє компанії оновити дані свого активного співробітника або змінити деталі надісланого запрошення (яке ще не прийняте).',
    }),
    ApiParam({
      name: 'employeeId',
      description: 'Унікальний ID співробітника або ID запрошення',
      example: '65f1a2b3c4d5e6f7a8b9c0d1',
    }),
    ApiBody({
      description: 'Поля, які потрібно оновити (всі поля є необов’язковими)',
      schema: {
        example: {
          email: 'new.email@techcorp.com',
          department: 'Marketing',
          role: 'senior',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Дані успішно оновлено',
      content: {
        'application/json': {
          examples: {
            activeEmployee: {
              summary: 'Успішне оновлення (Активний співробітник)',
              value: {
                message: 'Співробітника оновлено',
                data: {
                  _id: '65f1a2b3c4d5e6f7a8b9c0d1',
                  email: 'new.email@techcorp.com',
                  name: 'Jane Smith',
                  department: 'Marketing',
                  role: 'senior',
                  companyId: '65f1a2b3c4d5e6f7a8b9c0d1',
                  createdAt: '2026-03-05T10:00:00.000Z',
                  updatedAt: '2026-03-18T10:00:00.000Z',
                },
                status: 'active',
              },
            },
            pendingInvite: {
              summary: 'Успішне оновлення (Запрошення)',
              value: {
                message: 'Запрошення оновлено',
                data: {
                  _id: '65f1a2b3c4d5e6f7a8b9c0d2',
                  email: 'new.email@techcorp.com',
                  name: 'Jane Smith',
                  department: 'Marketing',
                  role: 'senior',
                  companyId: '65f1a2b3c4d5e6f7a8b9c0d1',
                  token: '74f817d8b0c446aa738fbcedc601...',
                  createdAt: '2026-03-05T10:00:00.000Z',
                  updatedAt: '2026-03-18T10:00:00.000Z',
                },
                status: 'pending',
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description:
        'Доступ заборонено (тільки компанії можуть виконувати цю дію)',
      schema: {
        example: {
          message: 'Тільки компанії можуть оновлювати дані співробітників',
          error: 'Forbidden',
          statusCode: 403,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description:
        'Співробітника або запрошення не знайдено (або належить іншій компанії)',
      schema: {
        example: {
          message:
            'Співробітника або запрошення з ID 65f1a2b3c4d5e6f7a8b9c0d1 не знайдено',
          error: 'Not Found',
          statusCode: 404,
        },
      },
    }),
    ApiResponse({
      status: 409,
      description: 'Конфлікт електронної пошти',
      content: {
        'application/json': {
          examples: {
            employeeConflict: {
              summary: 'Пошта зайнята іншим активним співробітником',
              value: {
                message: 'Співробітник з таким email вже існує.',
                error: 'Conflict',
                statusCode: 409,
              },
            },
            inviteConflict: {
              summary: 'Пошта зайнята іншим запрошенням',
              value: {
                message:
                  'Запрошення на цю пошту вже відправлено іншому користувачу.',
                error: 'Conflict',
                statusCode: 409,
              },
            },
          },
        },
      },
    }),
  );
}
