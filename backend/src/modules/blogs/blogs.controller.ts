import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request, ValidationPipe } from '@nestjs/common';
import { BlogsService } from './blogs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateBlogDto } from './dto/blog.dto';

@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  getBlogs() { return this.blogsService.findAll(); }

  @Get('post/:slug')
  getBlog(@Param('slug') slug: string) { return this.blogsService.findOne(slug); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  createBlog(@Body(new ValidationPipe()) data: CreateBlogDto, @Request() req) {
    return this.blogsService.create(data, req.user.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  deleteBlog(@Param('id') id: string) {
    return this.blogsService.delete(id);
  }
}
