import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ChatRequestDto } from './dto/chat-request.dto';
import { WelcomeRequestDto } from './dto/welcome-request.dto';

export function ApiGetAiStatus() {
  return applyDecorators(
    ApiOperation({
      summary: 'Перевірка статусу підключення до Gemini API',
      description:
        'Повертає true, якщо є хоча б один валідний API-ключ і клієнт ініціалізовано.',
    }),
    ApiResponse({
      status: 200,
      description: 'Статус підключення до ШІ отримано.',
      schema: {
        example: {
          status: true,
          message: 'Gemini API is ready',
        },
      },
    }),
  );
}

export function ApiChat() {
  return applyDecorators(
    ApiOperation({
      summary: 'Відправити запит до RAG системи',
      description:
        'Спілкування з документами компанії. Приймає запит та ID компанії для контекстного пошуку у векторній базі.',
    }),
    ApiBody({
      type: ChatRequestDto,
      description: 'Тіло запиту для чату з ШІ',
      schema: {
        example: {
          query: 'Які правила оформлення лікарняного в компанії?',
          companyId: '65f1a2b3c4d5e6f7a8b9c0d1',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Згенерована відповідь від ШІ на основі документів.',
      schema: {
        example: {
          answer:
            'Згідно з внутрішньою політикою, для оформлення лікарняного необхідно попередити свого ліда до 10:00 та надати медичну довідку в систему HR протягом 3 днів.',
          sources: ['policy_sick_leave_2026.pdf'],
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Некоректні вхідні дані (відсутній query або companyId).',
    }),
  );
}

export function ApiGenerateWelcome() {
  return applyDecorators(
    ApiOperation({
      summary: 'Згенерувати персоналізоване привітання',
      description:
        'Генерує привітне повідомлення для нового співробітника на основі профілю компанії та посади.',
    }),
    ApiBody({
      type: WelcomeRequestDto,
      description: 'Дані для генерації привітання',
      schema: {
        example: {
          companyId: '65f1a2b3c4d5e6f7a8b9c0d1',
          employeeName: 'Олександр',
          position: 'Frontend Developer',
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Згенероване привітання у текстовому форматі.',
      schema: {
        example: {
          message:
            'Привіт, Олександре! Ласкаво просимо до нашої команди на позицію Frontend Developer. Ми раді бачити тебе частиною компанії. Твій перший робочий день розпочнеться із зустрічі з ментором...',
        },
      },
    }),
    ApiResponse({ status: 400, description: 'Відсутній companyId у запиті.' }),
  );
}

export function ApiProcessFile() {
  return applyDecorators(
    ApiOperation({
      summary: 'Нарізати та векторизувати завантажений файл',
      description:
        'Обробляє збережений файл (PDF, TXT тощо), розбиває його на чанки і зберігає у векторну базу.',
    }),
    ApiParam({
      name: 'resourceId',
      description: 'Унікальний ідентифікатор файлу у сховищі',
      type: 'string',
      example: 'file_777abc888def',
    }),
    ApiResponse({
      status: 200,
      description: 'Файл успішно оброблено.',
      schema: {
        example: {
          status: 'success',
          message: 'File resource file_777abc888def processed and vectorized',
        },
      },
    }),
  );
}

export function ApiProcessUrl() {
  return applyDecorators(
    ApiOperation({
      summary: 'Скрейпінг та векторизація веб-сторінки',
      description:
        'Завантажує контент за вказаним посиланням, очищає від HTML-тегів і зберігає вектори для подальшого пошуку.',
    }),
    ApiParam({
      name: 'resourceId',
      description: 'Унікальний ідентифікатор збереженого URL',
      type: 'string',
      example: 'url_999xyz111qwe',
    }),
    ApiResponse({
      status: 200,
      description: 'URL успішно оброблено.',
      schema: {
        example: {
          status: 'success',
          message: 'URL resource url_999xyz111qwe processed and vectorized',
        },
      },
    }),
  );
}
