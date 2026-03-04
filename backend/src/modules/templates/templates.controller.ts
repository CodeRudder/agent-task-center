import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  QueryTemplateDto,
  ApplyTemplateDto,
} from './dto';
import { TaskTemplate } from './entities/task-template.entity';
import { Task } from '../task/entities/task.entity';

@ApiTags('templates')
@ApiBearerAuth()
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task template' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async create(
    @Body() createTemplateDto: CreateTemplateDto,
    @Request() req,
  ): Promise<TaskTemplate> {
    return this.templatesService.create(createTemplateDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all templates with filters' })
  @ApiResponse({ status: 200, description: 'List of templates' })
  async findAll(
    @Query() queryDto: QueryTemplateDto,
  ): Promise<{ items: TaskTemplate[]; total: number }> {
    return this.templatesService.findAll(queryDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get template by ID' })
  @ApiResponse({ status: 200, description: 'Template details' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<TaskTemplate> {
    return this.templatesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update template' })
  @ApiResponse({ status: 200, description: 'Template updated successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateTemplateDto: UpdateTemplateDto,
  ): Promise<TaskTemplate> {
    return this.templatesService.update(id, updateTemplateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete template' })
  @ApiResponse({ status: 200, description: 'Template deleted successfully' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  async remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<void> {
    return this.templatesService.remove(id);
  }

  @Post(':id/apply')
  @ApiOperation({ summary: 'Apply template to create a new task' })
  @ApiResponse({ status: 201, description: 'Task created from template' })
  @ApiResponse({ status: 404, description: 'Template not found' })
  @ApiResponse({ status: 400, description: 'Template is not active' })
  async applyTemplate(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() applyDto: ApplyTemplateDto,
    @Request() req,
  ): Promise<Task> {
    return this.templatesService.applyTemplate(id, applyDto, req.user.id);
  }
}
