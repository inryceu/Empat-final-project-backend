import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { AddUrlResourceDto } from './dto/upload-resource.dto';

export function ApiFindAllResources() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Отримати список ресурсів бази знань' }),
    ApiResponse({
      status: 200,
      description: 'Список ресурсів успішно отримано.',
    }),
    ApiResponse({ status: 401, description: 'Неавторизовано.' }),
  );
}

export function ApiFindOneResource() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Отримати метадані конкретного ресурсу' }),
    ApiParam({ name: 'id', description: 'ID ресурсу' }),
    ApiResponse({ status: 200, description: 'Метадані ресурсу отримано.' }),
    ApiResponse({ status: 404, description: 'Ресурс не знайдено.' }),
  );
}

export function ApiAddUrlResource() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Додати посилання (URL) до бази знань' }),
    ApiBody({ type: AddUrlResourceDto }),
    ApiResponse({ status: 201, description: 'Посилання успішно додано.' }),
    ApiResponse({ status: 400, description: 'Невалідний формат URL.' }),
  );
}

export function ApiUploadResource() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Завантажити файл до бази знань' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      description: 'Файл та його метадані',
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
          },
          title: {
            type: 'string',
            example: 'Інструкція для онбордингу',
          },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Файл успішно завантажено.' }),
  );
}

export function ApiRemoveResource() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Видалити ресурс' }),
    ApiParam({ name: 'id', description: 'ID ресурсу для видалення' }),
    ApiResponse({ status: 200, description: 'Ресурс успішно видалено.' }),
    ApiResponse({
      status: 400,
      description: 'Ви можете видаляти лише власні ресурси.',
    }),
    ApiResponse({ status: 404, description: 'Ресурс не знайдено.' }),
  );
}

export function ApiDownloadResource() {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary: 'Завантажити фізичний файл' }),
    ApiParam({ name: 'id', description: 'ID файлу для завантаження' }),
    ApiResponse({
      status: 200,
      description: 'Файл успішно відправлено.',
      content: { 'application/octet-stream': {} },
    }),
    ApiResponse({
      status: 404,
      description: 'Файл не знайдено або він не містить бінарних даних.',
    }),
  );
}
