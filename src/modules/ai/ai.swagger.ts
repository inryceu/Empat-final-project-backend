import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { ChatRequestDto } from './dto/chat-request.dto';

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

export function ApiGetOrGenerateAvatar() {
  return applyDecorators(
    ApiOperation({
      summary: 'Отримати або згенерувати персоналізований аватар',
      description:
        'Перевіряє, чи є у співробітника аватар. Якщо є — повертає його. Якщо немає — генерує новий за допомогою ШІ на основі даних профілю (стать, хобі, улюблена тварина), зберігає в базу і повертає результат.',
    }),
    ApiResponse({
      status: 200,
      description: 'Аватар успішно отримано або згенеровано.',
      schema: {
        example: {
          isNew: true,
          avatarUrl: 'https://your-storage.com/avatars/avatar_123.png',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description:
        'Доступ заборонено. Тільки співробітники можуть генерувати аватари.',
      schema: {
        example: {
          message:
            'Тільки співробітники можуть мати персоналізовані AI-аватари',
          error: 'Forbidden',
          statusCode: 403,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Профіль співробітника не знайдено в базі даних.',
    }),
  );
}

export function ApiGetChatHistory() {
  return applyDecorators(
    ApiOperation({
      summary: 'Отримати історію чату користувача',
      description:
        'Завантажує всю історію спілкування поточного користувача з RAG-асистентом. Повертає масив повідомлень у хронологічному порядку. Першим повідомленням зазвичай є закешоване привітання компанії.',
    }),
    ApiResponse({
      status: 200,
      description: 'Історія чату успішно отримана.',
      schema: {
        example: [
          {
            role: 'assistant',
            content:
              "Hello Jane Smith,\n\nA huge welcome to the Engineering team! We're thrilled to have you join us...",
            sources: [],
            createdAt: '2026-03-22T16:54:44.617Z',
          },
          {
            role: 'employee',
            content: 'tell me about nestjs',
            createdAt: '2026-03-22T16:55:25.121Z',
          },
          {
            role: 'assistant',
            content:
              'Based on the provided documents, you have hands-on experience with Nest.js. You list it as one of your technical skills under Node.js...',
            sources: [
              {
                score: 0.32021284103393555,
                text: '# Документація NestJS\n\nDocument extracted from: https://docs.nestjs.com\nExtraction date: 2026-03-22T16:53:21.043Z\n\n---...',
                resourceId: '69c01e807488a254c94343cb',
                resource: {
                  id: '69c01e807488a254c94343cb',
                  type: 'url',
                  title: 'Документація NestJS',
                  url: 'https://docs.nestjs.com',
                },
              },
              {
                score: 0.4314538240432739,
                text: 'MALUIEV PAVLO \n+380 68 444 15 34 / Kyiv, Ukraine / pavel.maluev@gmail.com / Telegram / LinkedIn / GitHub \nPROFILE...',
                resourceId: '69c01ea47488a254c94343d3',
                resource: {
                  id: '69c01ea47488a254c94343d3',
                  type: 'file',
                  title: 'CV maluiev pavlo',
                  url: null,
                },
              },
            ],
            createdAt: '2026-03-22T16:55:25.121Z',
          },
        ],
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Неавторизований доступ. Потрібен JWT токен.',
    }),
  );
}

export function ApiGetOrGenerateAvatarUrl() {
  return applyDecorators(
    ApiOperation({
      summary: 'Отримати або згенерувати URL персоналізованого аватара',
      description:
        'Перевіряє, чи є у співробітника збережений аватар. Якщо є — повертає публічне посилання на нього. Якщо немає — генерує новий за допомогою ШІ (на основі профілю), зберігає файл локально на сервері та повертає абсолютний URL (сформований на базі змінної оточення APP_URL).',
    }),
    ApiResponse({
      status: 200,
      description: 'Абсолютний URL аватара успішно отримано або згенеровано.',
      schema: {
        example: {
          isNew: true,
          avatarUrl:
            'https://empat-final-project-backend-production.up.railway.app/public/avatars/avatar_65f1a2b3c4d5e6f7a8b9c0d1_1711200000000.jpg',
        },
      },
    }),
    ApiResponse({
      status: 403,
      description:
        'Доступ заборонено. Тільки співробітники можуть генерувати аватари.',
      schema: {
        example: {
          message:
            'Тільки співробітники можуть мати персоналізовані AI-аватари',
          error: 'Forbidden',
          statusCode: 403,
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'Профіль співробітника не знайдено в базі даних.',
    }),
    ApiResponse({
      status: 500,
      description:
        'Внутрішня помилка сервера при спробі згенерувати або зберегти файл зображення.',
    }),
  );
}
