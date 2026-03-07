import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  Query,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { TaskService } from "./services/task.service";
import {
  CreateTaskDto,
  UpdateTaskDto,
  UpdateProgressDto,
} from "./dto/task.dto";
import {
  UpdateTaskStatusDto,
  GetStatusHistoriesQuery,
  StatusHistoriesResponse,
} from "./dto/update-task-status.dto";
import { Task, TaskStatus } from "./entities/task.entity";

@ApiTags("tasks")
@ApiBearerAuth()
@Controller("tasks")
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  @ApiOperation({ summary: "Create a new task" })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: any,
  ): Promise<Task> {
    return this.taskService.create(createTaskDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all tasks with filters" })
  @ApiQuery({ name: "status", required: false, enum: TaskStatus })
  @ApiQuery({ name: "assigneeId", required: false })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "pageSize", required: false, type: Number })
  async findAll(
    @Query("status") status?: TaskStatus,
    @Query("assigneeId") assigneeId?: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
  ): Promise<{ items: Task[]; total: number }> {
    return this.taskService.findAll({
      status,
      assigneeId,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get task by ID" })
  async findOne(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ): Promise<Task> {
    return this.taskService.findOne(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update task" })
  async update(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: any,
  ): Promise<Task> {
    return this.taskService.update(id, updateTaskDto, req.user.id);
  }

  @Patch(":id/progress")
  @ApiOperation({ summary: "Update task progress" })
  async updateProgress(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() updateProgressDto: UpdateProgressDto,
  ): Promise<Task> {
    return this.taskService.updateProgress(id, updateProgressDto);
  }

  @Patch(":id/status")
  @ApiOperation({ summary: "Update task status" })
  async updateStatus(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() dto: UpdateTaskStatusDto,
    @Request() req: any,
  ): Promise<Task> {
    return this.taskService.updateStatus(
      id,
      dto.status,
      req.user.id,
      req.user.type || "user",
      dto.reason,
    );
  }

  @Get(":id/status-histories")
  @ApiOperation({ summary: "Get task status histories" })
  async getStatusHistories(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Query() query: GetStatusHistoriesQuery,
  ): Promise<StatusHistoriesResponse> {
    return this.taskService.getStatusHistories(
      id,
      query.page || 1,
      query.limit || 20,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete task" })
  async remove(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ): Promise<void> {
    return this.taskService.remove(id);
  }
}
