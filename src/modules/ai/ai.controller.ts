import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
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
  @ApiChat()
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
  @ApiGenerateWelcome()
  async generateWelcome(@Body() body: WelcomeRequestDto) {
    if (!body.companyId || !body.employeeId) {
      throw new BadRequestException('companyId and employeeId are required');
    }

    return this.aiService.generateWelcomeMessage(body);
  }
}
