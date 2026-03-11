import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Res,
  StreamableFile,
  NotFoundException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';

import { createReadStream } from 'fs';
import { join } from 'path';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';

import { ResourcesService } from './resources.service';
import {
  AddUrlResourceDto,
  UploadResourceDto,
} from './dto/upload-resource.dto';
import {
  ApiFindAllResources,
  ApiFindOneResource,
  ApiAddUrlResource,
  ApiUploadResource,
  ApiRemoveResource,
  ApiDownloadResource,
} from './resources.swagger';

@ApiTags('Resources - База знань')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'resources', version: '1' })
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Get()
  @ApiFindAllResources()
  async findAll(@Req() req) {
    const userId = req.user._id?.toString() || req.user.id;

    if (req.user.userType === 'company') {
      return this.resourcesService.getCompanyGlobalResources(userId);
    } else {
      const companyId = req.user.companyId?.toString();
      return this.resourcesService.getEmployeeResources(companyId, userId);
    }
  }

  @Get(':id')
  @ApiFindOneResource()
  async findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

  @Post('url')
  @ApiAddUrlResource()
  async addUrl(@Req() req, @Body() dto: AddUrlResourceDto) {
    const userId = req.user._id?.toString() || req.user.id;
    const isCompany = req.user.userType === 'company';

    const companyId = isCompany ? userId : req.user.companyId?.toString();
    const employeeId = isCompany ? null : userId;

    return this.resourcesService.addUrlResource(dto, companyId, employeeId);
  }

  @Post('upload')
  @ApiUploadResource()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix = uuidv4();
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  async uploadFile(
    @Req() req,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadResourceDto,
  ) {
    const userId = req.user._id?.toString() || req.user.id;
    const isCompany = req.user.userType === 'company';
    const companyId = isCompany ? userId : req.user.companyId?.toString();
    const employeeId = isCompany ? null : userId;

    return this.resourcesService.uploadFile(file, dto, companyId, employeeId);
  }

  @Delete(':id')
  @ApiRemoveResource()
  async remove(@Req() req, @Param('id') id: string) {
    const userId = req.user._id?.toString() || req.user.id;
    return this.resourcesService.remove(id, userId, req.user.userType);
  }

  @Get(':id/download')
  @ApiDownloadResource()
  async downloadFile(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resource = await this.resourcesService.getRawFile(id);

    if (!resource || resource.type !== 'file' || !resource.filePath) {
      throw new NotFoundException('Файл не знайдено на сервері');
    }

    res.set({
      'Content-Type': resource.mimeType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(resource.fileName || 'downloaded_file')}"`,
    });

    // Читаємо файл з диска
    const fileStream = createReadStream(join(process.cwd(), resource.filePath));
    return new StreamableFile(fileStream);
  }
}
