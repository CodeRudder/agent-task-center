import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TagService } from './tag.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './entities/tag.entity';

@ApiTags('tags')
@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiOperation({ summary: '创建标签' })
  @ApiResponse({ status: 201, description: '标签创建成功', type: Tag })
  create(@Body() createTagDto: CreateTagDto): Promise<Tag> {
    return this.tagService.create(createTagDto);
  }

  @Get()
  @ApiOperation({ summary: '获取所有标签' })
  @ApiResponse({ status: 200, description: '返回所有标签', type: [Tag] })
  findAll(): Promise<Tag[]> {
    return this.tagService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个标签' })
  @ApiResponse({ status: 200, description: '返回标签详情', type: Tag })
  findOne(@Param('id') id: string): Promise<Tag> {
    return this.tagService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新标签' })
  @ApiResponse({ status: 200, description: '标签更新成功', type: Tag })
  update(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<Tag> {
    return this.tagService.update(id, updateTagDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除标签' })
  @ApiResponse({ status: 204, description: '标签删除成功' })
  remove(@Param('id') id: string): Promise<void> {
    return this.tagService.remove(id);
  }
}
