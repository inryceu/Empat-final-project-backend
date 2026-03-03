import { Controller, Post, Body, Get, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './services/ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { WelcomeRequestDto } from './dto/welcome-request.dto';

@ApiTags('AI - RAG System')
@ApiBearerAuth()
@Controller({ path: 'ai', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  @ApiOperation({ summary: 'Перевірка статусу підключення до Gemini API' })
  async getStatus() {
    return this.aiService.getStatus();
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Відправити запит до RAG системи (спілкування з документами)' })
  async chat(@Body() body: ChatRequestDto) {
    if (!body.query || !body.companyId) {
      throw new Error('Query and companyId are required');
    }
    return this.aiService.generateResponse(body.query, body.companyId);
  }

  @Post('welcome')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Згенерувати персоналізоване привітання для новачка' })
  async generateWelcome(@Body() body: WelcomeRequestDto) {
    if (!body.companyId) {
      throw new Error('companyId is required');
    }
    return this.aiService.generateWelcomeMessage(body);
  }

  @Post('process/file/:resourceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Нарізати та векторизувати завантажений файл' })
  async processFile(@Param('resourceId') resourceId: string) {
    await this.aiService.processFile(resourceId);
    return { status: 'success', message: `File resource ${resourceId} processed` };
  }

  @Post('process/url/:resourceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Скрейпінг та векторизація веб-сторінки' })
  async processUrl(@Param('resourceId') resourceId: string) {
    await this.aiService.processUrl(resourceId);
    return { status: 'success', message: `URL resource ${resourceId} processed` };
  }
}