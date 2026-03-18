import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
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
  async chat(@Req() req, @Body() body: ChatRequestDto) {
    const companyId =
      req.user.userType === 'company' ? req.user.id : req.user.companyId;
    const employeeId = req.user.userType === 'company' ? null : req.user.id;

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
}
