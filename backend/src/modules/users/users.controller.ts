import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch, Req, ForbiddenException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users', 'ADMIN', 'MANAGER')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('ADMIN')
  @Post()
  create(@Body() body: CreateUserDto) {
    return this.usersService.create(body);
  }

  @Roles('ADMIN', 'MANAGER')
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user profile (Self or Admin)' })
  findOne(@Param('id') id: string, @Req() req: any) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'MANAGER' && req.user.id !== id) {
      throw new ForbiddenException('Kechirasiz, siz faqat o\'z profilingizni ko\'rishingiz mumkin');
    }
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile (Self or Admin)' })
  update(@Param('id') id: string, @Body() body: UpdateUserDto, @Req() req: any) {
    // Users can only update their own profile, unless they are an ADMIN
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      throw new ForbiddenException('Kechirasiz, siz faqat o\'z profilingizni tahrirlashingiz mumkin');
    }
    // Only Admin can change roles
    if (body.role && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Faqat adminlar rollarni o\'zgartirishi mumkin');
    }
    return this.usersService.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }
}
