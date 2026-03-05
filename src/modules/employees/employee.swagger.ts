import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UpdateEmployeeDto } from './dto/update-employee.dto';

const employeeExample = {
  _id: '65f1a2b3c4d5e6f7a8b9c0d1',
  name: 'Олексій Іванов',
  email: 'alexey.ivanov@company.com',
  department: 'Engineering',
  role: 'middle',
  gender: 'male',
  hobbies: 'Шахи, Велоспорт',
  favoriteAnimal: 'Собака',
  companyId: '65f1a2b3c4d5e6f7a8b9c0d5',
  createdAt: '2026-03-05T10:00:00.000Z',
  updatedAt: '2026-03-05T10:00:00.000Z',
};

export function ApiFindAllEmployees() {
  return applyDecorators(
    ApiOperation({
      summary: 'Отримати всіх співробітників',
      description: 'Повертає масив усіх зареєстрованих співробітників у системі.',
    }),
    ApiResponse({
      status: 200,
      description: 'Список співробітників успішно отримано.',
      schema: {
        example: [employeeExample],
      },
    }),
    ApiResponse({ status: 401, description: 'Неавторизовано.' }),
  );
}

export function ApiFindOneEmployee() {
  return applyDecorators(
    ApiOperation({
      summary: 'Отримати співробітника за ID',
      description: 'Пошук конкретного співробітника за його унікальним ідентифікатором.',
    }),
    ApiParam({
      name: 'id',
      description: 'Унікальний ідентифікатор співробітника (Mongo ObjectId)',
      type: 'string',
      example: '65f1a2b3c4d5e6f7a8b9c0d1',
    }),
    ApiResponse({
      status: 200,
      description: 'Співробітника знайдено.',
      schema: { example: employeeExample },
    }),
    ApiResponse({ status: 401, description: 'Неавторизовано.' }),
    ApiResponse({ status: 404, description: 'Співробітника з таким ID не існує.' }),
  );
}

export function ApiUpdateEmployee() {
  return applyDecorators(
    ApiOperation({
      summary: 'Оновити дані співробітника',
      description: 'Часткове оновлення профілю співробітника. Передавайте лише ті поля, які потрібно змінити.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID співробітника, якого потрібно оновити',
      type: 'string',
      example: '65f1a2b3c4d5e6f7a8b9c0d1',
    }),
    ApiBody({
      type: UpdateEmployeeDto,
      description: 'JSON з полями для оновлення',
      schema: {
        example: {
          department: 'Architecture',
          role: 'senior',
          hobbies: 'Настільні ігри',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Дані співробітника успішно оновлено.',
      schema: {
        example: {
          ...employeeExample,
          department: 'Architecture',
          role: 'senior',
          hobbies: 'Настільні ігри',
          updatedAt: '2026-03-05T10:15:00.000Z',
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Помилка валідації вхідних даних.' }),
    ApiResponse({ status: 401, description: 'Неавторизовано.' }),
    ApiResponse({ status: 404, description: 'Співробітника не знайдено.' }),
  );
}

export function ApiRemoveEmployee() {
  return applyDecorators(
    ApiOperation({
      summary: 'Видалити співробітника',
      description: 'Повне видалення співробітника з бази даних.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID співробітника для видалення',
      type: 'string',
      example: '65f1a2b3c4d5e6f7a8b9c0d1',
    }),
    ApiResponse({
      status: 200,
      description: 'Співробітника успішно видалено.',
      schema: {
        example: {
          status: 'success',
          message: 'Employee 65f1a2b3c4d5e6f7a8b9c0d1 successfully deleted',
        },
      },
    }),
    ApiResponse({ status: 401, description: 'Неавторизовано.' }),
    ApiResponse({ status: 404, description: 'Співробітника не знайдено.' }),
  );
}