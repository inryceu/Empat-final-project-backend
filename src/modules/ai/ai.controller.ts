import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
<<<<<<< Updated upstream
  BadRequestException,
=======
>>>>>>> Stashed changes
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './services/ai.service';
import { ChatRequestDto } from './dto/chat-request.dto';
import { WelcomeRequestDto } from './dto/welcome-request.dto';

import { ApiGetAiStatus, ApiChat, ApiGenerateWelcome } from './ai.swagger';

@ApiTags('AI - RAG System')
@ApiBearerAuth()
@Controller({ path: 'ai', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('status')
  @ApiGetAiStatus()
  async getStatus() {
    return this.aiService.getStatus();
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
<<<<<<< Updated upstream
  @ApiChat()
=======
  @ApiOperation({
    summary: 'Відправити запит до RAG системи (спілкування з документами)',
  })
>>>>>>> Stashed changes
  async chat(@Body() body: ChatRequestDto) {
    if (!body.query || !body.companyId || !body.employeeId) {
      throw new BadRequestException(
        'Query, companyId and employeeId are required',
      );
    }

    return this.aiService.generateResponse(
      body.query,
      body.companyId,
      body.employeeId,
    );
  }

  @Post('welcome')
  @HttpCode(HttpStatus.OK)
<<<<<<< Updated upstream
  @ApiGenerateWelcome()
=======
  @ApiOperation({
    summary: 'Згенерувати персоналізоване привітання для новачка',
  })
>>>>>>> Stashed changes
  async generateWelcome(@Body() body: WelcomeRequestDto) {
    if (!body.companyId || !body.employeeId) {
      throw new BadRequestException('companyId and employeeId are required');
    }

    return this.aiService.generateWelcomeMessage(body);
  }
<<<<<<< Updated upstream
=======

  @Post('process/file/:resourceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Нарізати та векторизувати завантажений файл' })
  async processFile(@Param('resourceId') resourceId: string) {
    await this.aiService.processFile(resourceId);
    return {
      status: 'success',
      message: `File resource ${resourceId} processed`,
    };
  }

  @Post('process/url/:resourceId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Скрейпінг та векторизація веб-сторінки' })
  async processUrl(@Param('resourceId') resourceId: string) {
    await this.aiService.processUrl(resourceId);
    return {
      status: 'success',
      message: `URL resource ${resourceId} processed`,
    };
  }
>>>>>>> Stashed changes
}
