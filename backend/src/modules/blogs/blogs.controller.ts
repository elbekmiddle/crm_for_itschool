import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { BlogsService } from './blogs.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateBlogPostDto, UpdateBlogPostDto } from './dto/blog-post.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all blog posts (Public)' })
  getBlogs() { return this.blogsService.findAll(); }

  @Get('post/:slug')
  @ApiOperation({ summary: 'Get blog post by slug (Public)' })
  getBlog(@Param('slug') slug: string) { return this.blogsService.findOne(slug); }

  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @Post('views')
  @ApiOperation({ summary: 'Batch increment view counts (Public, throttled on client)' })
  recordViews(@Body() body: { deltas?: Record<string, number> }) {
    return this.blogsService.addViewDeltas(body?.deltas || {});
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('ANALYTICS_VIEW')
  @Post()
  @ApiOperation({ summary: 'Create a new blog post', description: 'Permissions: ANALYTICS_VIEW' })
  createBlog(@Body() data: CreateBlogPostDto, @Request() req) {
    return this.blogsService.create(data, req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('ANALYTICS_VIEW')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a blog post', description: 'Permissions: ANALYTICS_VIEW' })
  updateBlog(@Param('id') id: string, @Body() data: UpdateBlogPostDto) {
    return this.blogsService.update(id, data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('ANALYTICS_VIEW')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a blog post', description: 'Permissions: ANALYTICS_VIEW' })
  deleteBlog(@Param('id') id: string) {
    return this.blogsService.delete(id);
  }
}
