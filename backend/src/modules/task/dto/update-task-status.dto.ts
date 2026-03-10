import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TaskStatus } from "../entities/task.entity";

export class UpdateTaskStatusDto {
  @ApiProperty({
    description: "新状态",
    enum: TaskStatus,
    example: TaskStatus.IN_PROGRESS,
  })
  @IsEnum(TaskStatus)
  status: TaskStatus;

  @ApiPropertyOptional({
    description: "变更原因（某些状态流转必填）",
    example: "开始处理该任务",
  })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class GetStatusHistoriesQuery {
  @ApiPropertyOptional({
    description: "页码",
    example: 1,
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({
    description: "每页数量",
    example: 20,
    default: 20,
  })
  @IsOptional()
  limit?: number;
}

export interface StatusHistoryItem {
  id: string;
  oldStatus: TaskStatus;
  newStatus: TaskStatus;
  changedBy: string | null;
  changedByType: "user" | "agent";
  reason?: string | null;
  changedAt: string;
  changerName?: string | null;
  changerId?: string | null;
}

export interface StatusHistoriesResponse {
  items: StatusHistoryItem[];
  total: number;
  page: number;
  limit: number;
}
