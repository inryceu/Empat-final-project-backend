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
import { ChatRequestDto } from './dto/chat-request.dto';

import {
  ApiGetAiStatus,
  ApiChat,
  ApiGenerateWelcome,
  ApiGetOrGenerateAvatar,
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
  async chat(@Req() req, @Body() body: ChatRequestDto) {
    const isCompany = req.user.userType === 'company';

    const companyId = isCompany ? req.user.id : req.user.companyId;
    const employeeId = isCompany ? null : req.user.id;

    return this.aiService.generateResponse(body.query, companyId, employeeId);
  }

  @Post('welcome')
  @HttpCode(HttpStatus.OK)
  @ApiGenerateWelcome()
  async generateWelcome(@Req() req) {
    const user = req.user as any;
    const isCompany = user.userType === 'company';

    const data = {
      companyId: isCompany ? user.id : user.companyId,

      employeeId: isCompany ? null : user.id,

      employeeName: user.name,
      department: user.department,
    };

    return this.aiService.generateWelcomeMessage(data);
  }

  @Post('avatar')
  @HttpCode(HttpStatus.OK)
  @ApiGetOrGenerateAvatar()
  async getOrGenerateAvatar(@Req() req) {
    const user = req.user as any;

    console.log(req.user);

    if (user.userType === 'company') {
      throw new ForbiddenException(
        'Тільки співробітники можуть мати персоналізовані AI-аватари',
      );
    }

    return this.aiService.getOrGenerateAvatar(user.companyId, user.id);
  }
}
