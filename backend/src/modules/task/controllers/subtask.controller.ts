import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SubtaskService } from '../services/subtask.service';
import { CreateSubtaskDto, UpdateSubtaskDto } from '../dto/subtask.dto';

@ApiTags('subtasks')
@Controller('tasks/:taskId/subtasks')
export class SubtaskController {
  constructor(private readonly subtaskService: SubtaskService) {}

  @Post()
  @ApiOperation({ summary: 'Create a subtask' })
  create(@Param('taskId') taskId: string, @Body() dto: CreateSubtaskDto) {
    dto.taskId = taskId;
    return this.subtaskService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all subtasks for a task' })
  findAll(@Param('taskId') taskId: string) {
    return this.subtaskService.findByTask(taskId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a subtask by id' })
  findOne(@Param('id') id: string) {
    return this.subtaskService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a subtask' })
  update(@Param('id') id: string, @Body() dto: UpdateSubtaskDto) {
    return this.subtaskService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a subtask' })
  remove(@Param('id') id: string) {
    return this.subtaskService.remove(id);
  }
}
