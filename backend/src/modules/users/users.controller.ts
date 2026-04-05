import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch, Req, ForbiddenException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Permissions('ANALYTICS_VIEW')
  @Post()
  @ApiOperation({ summary: 'Create a new user', description: 'Permissions: ANALYTICS_VIEW' })
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Permissions('ANALYTICS_VIEW')
  @Get()
  @ApiOperation({ summary: 'Get all users', description: 'Permissions: ANALYTICS_VIEW' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile', description: 'Self-access or Permissions: ANALYTICS_VIEW' })
  findOne(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' && req.user.id !== id) {
      throw new ForbiddenException('Kechirasiz, siz faqat o\'z profilingizni ko\'rishingiz mumkin');
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile', description: 'Self-access or Permissions: ANALYTICS_VIEW' })
  update(@Param('id') id: string, @Body() body: UpdateUserDto, @Req() req: any) {
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      throw new ForbiddenException('Kechirasiz, siz faqat o\'z profilingizni tahrirlashingiz mumkin');
    }
    if (body.role && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Faqat adminlar rollarni o\'zgartirishi mumkin');
    }
    return this.usersService.update(id, body);
  }

  @Post(':id/upload-photo')
  @UseInterceptors(FileInterceptor('photo'))
  @ApiOperation({ summary: 'Upload user profile photo', description: 'Role restriction: Teacher/Manager/Admin' })
  async uploadPhoto(@Param('id') id: string, @UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (req.user.role === 'STUDENT') throw new ForbiddenException('Talabalar rasm yuklay olmaydi');
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      throw new ForbiddenException('Siz faqat o\'z rasmizni yuklay olasiz');
    }
    const result = await this.usersService.uploadPhoto(id, file);
    return { photo_url: result.photo_url };
  }

  @Permissions('ANALYTICS_VIEW')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user', description: 'Permissions: ANALYTICS_VIEW' })
  remove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }
}
