import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { UpdateUserDto } from './dto/update-user.dto';

export function ApiFindAllUsers() {
  return applyDecorators(
    ApiOperation({
      summary: 'Отримати всіх користувачів',
      description: 'Повертає масив усіх зареєстрованих користувачів у системі.',
    }),
    ApiResponse({
      status: 200,
      description: 'Список користувачів успішно отримано.',
      schema: {
        example: [
          {
            _id: '65f1a2b3c4d5e6f7a8b9c0d1',
            email: 'pavel.maluev@gmail.com',
            fullName: 'Павло Малуєв',
            role: 'user',
            createdAt: '2026-03-03T10:00:00.000Z',
          },
          {
            _id: '65f1a2b3c4d5e6f7a8b9c0d2',
            email: 'admin@empat.tech',
            fullName: 'Admin Empat',
            role: 'admin',
            createdAt: '2026-03-01T12:00:00.000Z',
          },
        ],
      },
    }),
    ApiResponse({ status: 401, description: 'Неавторизовано.' }),
  );
}

export function ApiFindOneUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Отримати користувача за ID',
      description:
        'Пошук конкретного користувача за його унікальним ідентифікатором.',
    }),
    ApiParam({
      name: 'id',
      description: 'Унікальний ідентифікатор користувача (Mongo ObjectId)',
      type: 'string',
      example: '65f1a2b3c4d5e6f7a8b9c0d1', // Одразу підставиться в поле ID
    }),
    ApiResponse({
      status: 200,
      description: 'Користувача знайдено.',
      schema: {
        example: {
          _id: '65f1a2b3c4d5e6f7a8b9c0d1',
          email: 'pavel.maluev@gmail.com',
          fullName: 'Павло Малуєв',
          role: 'user',
          createdAt: '2026-03-03T10:00:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Користувача з таким ID не існує.',
    }),
  );
}

export function ApiUpdateUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Оновити дані користувача',
      description:
        'Часткове оновлення профілю користувача. Передавайте лише ті поля, які потрібно змінити.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID користувача, якого потрібно оновити',
      type: 'string',
      example: '65f1a2b3c4d5e6f7a8b9c0d1',
    }),
    ApiBody({
      type: UpdateUserDto,
      description: 'JSON з полями для оновлення',
      schema: {
        example: {
          fullName: 'Павло (Оновлений)',
          role: 'admin',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Дані користувача успішно оновлено.',
      schema: {
        example: {
          _id: '65f1a2b3c4d5e6f7a8b9c0d1',
          email: 'pavel.maluev@gmail.com',
          fullName: 'Павло (Оновлений)',
          role: 'admin',
          updatedAt: '2026-03-03T10:15:00.000Z',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Помилка валідації вхідних даних.',
    }),
    ApiResponse({ status: 404, description: 'Користувача не знайдено.' }),
  );
}

export function ApiRemoveUser() {
  return applyDecorators(
    ApiOperation({
      summary: 'Видалити користувача',
      description: 'Повне видалення користувача з бази даних.',
    }),
    ApiParam({
      name: 'id',
      description: 'ID користувача для видалення',
      type: 'string',
      example: '65f1a2b3c4d5e6f7a8b9c0d1',
    }),
    ApiResponse({
      status: 200,
      description: 'Користувача успішно видалено.',
      schema: {
        example: {
          status: 'success',
          message: 'User 65f1a2b3c4d5e6f7a8b9c0d1 successfully deleted',
        },
      },
    }),
    ApiResponse({ status: 404, description: 'Користувача не знайдено.' }),
  );
}
