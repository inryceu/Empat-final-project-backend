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

export function ApiGenerateWelcome() {
  return applyDecorators(
    ApiOperation({
      summary: 'Згенерувати привітання компанії',
      description:
        'Генерує привітне повідомлення для нових співробітників за допомогою ШІ. Дані для генерації (назва компанії, галузь тощо) беруться автоматично з профілю компанії поточного користувача.',
    }),
    ApiResponse({
      status: 200,
      description: 'Згенероване привітання у текстовому форматі.',
      schema: {
        example: {
          message:
            'Ласкаво просимо до Tech Corp! Ми раді вітати тебе в нашій команді. У нас попереду багато цікавих проєктів, і ми впевнені, що твій досвід допоможе нам досягти нових висот...',
        },
      },
    }),
    ApiResponse({
      status: 400,
      description:
        'Відсутній companyId або недостатньо даних компанії для генерації.',
    }),
    ApiResponse({
      status: 403,
      description: 'Тільки представники компанії можуть генерувати привітання.',
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
        'Завантажує всю історію спілкування поточного користувача з RAG-асистентом. Повертає масив повідомлень у хронологічному порядку. Першим повідомленням зазвичай є закешоване привітання.',
    }),
    ApiResponse({
      status: 200,
      description: 'Історія чату успішно отримана.',
      schema: {
        example: [
          {
            role: 'assistant',
            content: 'Ласкаво просимо! Я твій ШІ-помічник. Чим можу допомогти сьогодні?',
            createdAt: '2026-03-22T10:00:00.000Z',
          },
          {
            role: 'employee',
            content: 'Як оформити лікарняний?',
            createdAt: '2026-03-22T10:05:00.000Z',
          },
          {
            role: 'assistant',
            content: 'Для оформлення лікарняного необхідно попередити свого ліда до 10:00...',
            createdAt: '2026-03-22T10:05:05.000Z',
          }
        ],
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Неавторизований доступ. Потрібен JWT токен.',
    }),
  );
}
