import { IsArray, IsOptional, IsUUID, IsEnum, ValidateNested, ArrayMaxSize, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus } from '../entities/task.entity';

/**
 * 批量创建任务DTO
 */
export class BatchCreateTaskDto {
  @ApiProperty({ description: '任务数组', type: [Object], maxItems: 100 })
  @IsArray()
  @ArrayMaxSize(100, { message: '单次最多创建100个任务' })
  @ValidateNested({ each: true })
  @Type(() => TaskCreateItemDto)
  tasks: TaskCreateItemDto[];
}

/**
 * 单个任务创建项
 */
export class TaskCreateItemDto {
  @ApiProperty({ description: '任务标题' })
  title: string;

  @ApiPropertyOptional({ description: '任务描述' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: '优先级', enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: '状态', enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ description: '负责人ID' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: '标签ID数组' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];

  @ApiPropertyOptional({ description: '父任务ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}

/**
 * 批量编辑任务DTO
 */
export class BatchUpdateTaskDto {
  @ApiProperty({ description: '任务ID数组', maxItems: 500 })
  @IsArray()
  @ArrayMaxSize(500, { message: '单次最多编辑500个任务' })
  @IsUUID('4', { each: true })
  taskIds: string[];

  @ApiPropertyOptional({ description: '优先级', enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: '状态', enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ description: '负责人ID' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: '标签ID数组' })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  tagIds?: string[];
}

/**
 * 批量删除任务DTO
 */
export class BatchDeleteTaskDto {
  @ApiProperty({ description: '任务ID数组', maxItems: 200 })
  @IsArray()
  @ArrayMaxSize(200, { message: '单次最多删除200个任务' })
  @IsUUID('4', { each: true })
  taskIds: string[];
}

/**
 * 批量操作结果DTO
 */
export class BatchOperationResultDto {
  @ApiProperty({ description: '操作成功数量' })
  successCount: number;

  @ApiProperty({ description: '操作失败数量' })
  failedCount: number;

  @ApiProperty({ description: '失败详情', required: false })
  @IsOptional()
  errors?: Array<{ index: number; error: string }>;

  @ApiProperty({ description: '总耗时（毫秒）' })
  duration: number;
}

/**
 * 导出任务查询DTO
 */
export class ExportTasksDto {
  @ApiPropertyOptional({ description: '任务状态筛选' })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ description: '负责人ID筛选' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: '导出格式', enum: ['xlsx', 'csv'], default: 'xlsx' })
  @IsOptional()
  format?: 'xlsx' | 'csv';
}

/**
 * 导入任务DTO（Excel/CSV）
 */
export class ImportTasksDto {
  @ApiProperty({ description: '文件路径（由multer上传后填充）' })
  filePath: string;
}
