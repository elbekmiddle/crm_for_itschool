import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch, Req, ForbiddenException, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
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

  @Roles('ADMIN', 'MANAGER')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile (Self or Admin)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('avatar'))
  update(@Param('id') id: string, @Body() body: UpdateUserDto, @Req() req: any, @UploadedFile() file: Express.Multer.File) {
    // Users can only update their own profile, unless they are an ADMIN
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    // Only Admin can change roles
    if (body.role && req.user.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can change roles');
    }
    return this.usersService.update(id, body, file);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.softDelete(id);
  }
}
