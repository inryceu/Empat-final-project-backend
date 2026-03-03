import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '@nestjs/passport';

import {
  ApiFindAllUsers,
  ApiFindOneUser,
  ApiUpdateUser,
  ApiRemoveUser,
} from './users.swagger';

@ApiTags('Users - Користувачі')
@ApiBearerAuth()
@Controller({ path: 'users', version: '1' })
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiFindAllUsers()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiFindOneUser()
  findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiUpdateUser()
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiRemoveUser()
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}

