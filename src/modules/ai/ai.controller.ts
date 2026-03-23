import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './services/ai.service';
import { ChatService } from '../chat/chat.service';
import { ChatRequestDto } from './dto/chat-request.dto';

import {
  ApiGetAiStatus,
  ApiChat,
  ApiGetOrGenerateAvatar,
  ApiGetChatHistory,
} from './ai.swagger';

@ApiTags('AI - RAG System')
@ApiBearerAuth()
@Controller({ path: 'ai', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly chatService: ChatService,
  ) {}

  @Get('status')
  @ApiGetAiStatus()
  async getStatus() {
    return this.aiService.getStatus();
  }

  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @ApiChat()
  async chat(@Req() req, @Body() body: ChatRequestDto) {
    const isCompany = req.user.userType === 'company';

    const companyId = isCompany ? req.user.id : req.user.companyId;
    const employeeId = isCompany ? null : req.user.id;

    return this.aiService.generateResponse(body.query, companyId, employeeId);
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiGetOrGenerateAvatar()
  async getOrGenerateAvatar(@Req() req) {
    const user = req.user as any;

    if (user.userType === 'company') {
      throw new ForbiddenException(
        'Тільки співробітники можуть мати персоналізовані AI-аватари',
      );
    }

    return this.aiService.getOrGenerateAvatar(user.companyId, user.id);
  }

  @Post('avatar-url')
  @HttpCode(HttpStatus.OK)
  // @ApiGetOrGenerateAvatarUrl()
  async getOrGenerateAvatarUrl(@Req() req) {
    const user = req.user as any;
    if (user.userType === 'company') {
      throw new ForbiddenException('Тільки співробітники можуть мати персоналізовані AI-аватари');
    }
    
    return this.aiService.getOrGenerateAvatarUrl(user.companyId, user.id);
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiGetChatHistory()
  async getChatHistory(@Req() req) {
    const user = req.user as any;
    const userId = user.id;

    let history = await this.chatService.getHistory(userId);

    if (history.length === 0) {
      const isCompany = user.userType === 'company';
      const data = {
        companyId: isCompany ? user.id : user.companyId,
        employeeId: isCompany ? null : user.id,
        employeeName: user.name,
        department: user.department,
      };

      await this.aiService.generateWelcomeMessage(data);

      history = await this.chatService.getHistory(userId);
    }

    return history;
  }
}
