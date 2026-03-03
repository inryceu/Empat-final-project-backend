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

import {
  ApiGetAiStatus,
  ApiChat,
  ApiGenerateWelcome,
  ApiProcessFile,
  ApiProcessUrl,
} from './ai.swagger';

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
    if (!body.query || !body.companyId) {
      throw new BadRequestException('Query and companyId are required');
    }
    return this.aiService.generateResponse(body.query, body.companyId);
  }

  @Post('welcome')
  @HttpCode(HttpStatus.OK)
  @ApiGenerateWelcome()
  async generateWelcome(@Body() body: WelcomeRequestDto) {
    if (!body.companyId) {
      throw new BadRequestException('companyId is required');
    }
    return this.aiService.generateWelcomeMessage(body);
  }

  @Post('process/file/:resourceId')
  @HttpCode(HttpStatus.OK)
  @ApiProcessFile()
  async processFile(@Param('resourceId') resourceId: string) {
    await this.aiService.processFile(resourceId);
    return {
      status: 'success',
      message: `File resource ${resourceId} processed`,
    };
  }

  @Post('process/url/:resourceId')
  @HttpCode(HttpStatus.OK)
  @ApiProcessUrl()
  async processUrl(@Param('resourceId') resourceId: string) {
    await this.aiService.processUrl(resourceId);
    return {
      status: 'success',
      message: `URL resource ${resourceId} processed`,
    };
  }
}
