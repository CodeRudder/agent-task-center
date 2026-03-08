import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SubtaskService } from '../services/subtask.service';
import { CreateSubtaskDto, UpdateSubtaskDto, UpdateProgressDto } from '../dto/subtask.dto';

@ApiTags('Subtasks')
@Controller('subtasks')
@UseGuards(JwtAuthGuard)
export class CreateSubtaskController {
  constructor(private readonly subtaskService: SubtaskService) {}

  @Post()
  @ApiOperation({ summary: '创建子任务' })
  @ApiResponse({ status: 201, description: '子任务创建成功' })
  async createSubtask(@Body() createSubtaskDto: CreateSubtaskDto) {
    return this.subtaskService.create(createSubtaskDto);
  }
}

@ApiTags('Subtasks')
@Controller('subtasks')
@UseGuards(JwtAuthGuard)
export class GetSubtasksController {
  constructor(private readonly subtaskService: SubtaskService) {}

  @Get(':taskId')
  @ApiOperation({ summary: '获取任务的所有子任务' })
  @ApiResponse({ status: 200, description: '成功返回子任务列表' })
  async getSubtasks(@Param('taskId') taskId: string) {
    return this.subtaskService.getSubtasksByTask(taskId);
  }
}

@ApiTags('Subtasks')
@Controller('subtasks')
@UseGuards(JwtAuthGuard)
export class UpdateSubtaskController {
  constructor(private readonly subtaskService: SubtaskService) {}

  @Patch(':id')
  @ApiOperation({ summary: '更新子任务' })
  @ApiResponse({ status: 200, description: '子任务更新成功' })
  async updateSubtask(
    @Param('id') id: string,
    @Body() updateSubtaskDto: UpdateSubtaskDto,
  ) {
    return this.subtaskService.update(id, updateSubtaskDto);
  }
}

@ApiTags('Subtasks')
@Controller('subtasks')
@UseGuards(JwtAuthGuard)
export class DeleteSubtaskController {
  constructor(private readonly subtaskService: SubtaskService) {}

  @Delete(':id')
  @ApiOperation({ summary: '删除子任务' })
  @HttpCode(204)
  async deleteSubtask(@Param('id') id: string) {
    await this.subtaskService.delete(id);
  }
}

@ApiTags('Subtasks')
@Controller('subtasks')
@UseGuards(JwtAuthGuard)
export class UpdateProgressController {
  constructor(private readonly subtaskService: SubtaskService) {}

  @Patch(':id/progress')
  @ApiOperation({ summary: '更新子任务进度' })
  @ApiResponse({ status: 200, description: '进度更新成功，父任务进度自动汇总' })
  async updateProgress(
    @Param('id') id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ) {
    return this.subtaskService.updateProgress(id, updateProgressDto);
  }
}
