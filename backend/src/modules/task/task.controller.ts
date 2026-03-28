import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
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
import { CommentService } from "../comment/comment.service";
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
import { Public } from "../../common/decorators/public.decorator";

@ApiTags("tasks")
@ApiBearerAuth()
@Controller("tasks")
export class TaskController {
  constructor(
    private readonly taskService: TaskService,
    private readonly commentService: CommentService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a new task" })
  async create(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: any,
  ): Promise<Task> {
    // JWT认证后req.user一定存在，直接使用req.user.id
    return this.taskService.create(createTaskDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: "Get all tasks with filters" })
  @ApiQuery({ name: "status", required: false, enum: TaskStatus })
  @ApiQuery({ name: "assigneeId", required: false })
  @ApiQuery({ name: "search", required: false, description: "Search in title and description" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "pageSize", required: false, type: Number })
  @ApiQuery({ name: "since", required: false, description: "Incremental query - only return tasks updated after this timestamp (ISO 8601)" })
  async findAll(
    @Query("status") status?: TaskStatus,
    @Query("assigneeId") assigneeId?: string,
    @Query("search") search?: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
    @Query("since") since?: string,
  ): Promise<{ items: Task[]; total: number }> {
    return this.taskService.findAll({
      status,
      assigneeId,
      search,
      page: page ? Number(page) : 1,
      pageSize: pageSize ? Number(pageSize) : 10,
      since,
    });
  }

  @Get('incremental')
  @ApiOperation({ summary: 'Incremental query for tasks (cursor-based pagination)' })
  @ApiQuery({ name: 'since', required: false, description: 'Cursor - timestamp of last task from previous query' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of tasks per page (default: 20)' })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  @ApiQuery({ name: 'priority', required: false })
  @ApiQuery({ name: 'assigneeId', required: false })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field: createdAt, updatedAt, dueDate (default: updatedAt)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: ASC, DESC (default: DESC)' })
  async findIncremental(
    @Query('since') since?: string,
    @Query('limit') limit?: number,
    @Query('status') status?: TaskStatus,
    @Query('priority') priority?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ): Promise<{ data: Task[]; hasMore: boolean; nextCursor: string | null }> {
    return this.taskService.findIncremental({
      since,
      limit: limit ? Number(limit) : 20,
      status,
      priority,
      assigneeId,
      sortBy: sortBy || 'updatedAt',
      sortOrder: sortOrder || 'DESC',
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get task by ID" })
  async findOne(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ): Promise<Task> {
    return this.taskService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update task (PUT)" })
  async updatePut(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: any,
  ): Promise<Task> {
    return this.taskService.update(id, updateTaskDto, req.user.id);
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

  @Get(":id/comments")
  @ApiOperation({ summary: "Get task comments (compatibility endpoint)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "pageSize", required: false, type: Number })
  async getTaskComments(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Query("page") page?: number,
    @Query("pageSize") pageSize?: number,
  ): Promise<{ total: number; page: number; pageSize: number; comments: any[] }> {
    return this.commentService.findByTaskId(
      id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Get(":id/history")
  @ApiOperation({ summary: "Get task history (compatibility endpoint)" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getTaskHistory(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ): Promise<any> {
    // 返回状态历史作为任务历史
    return this.taskService.getStatusHistories(
      id,
      page || 1,
      limit || 20,
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete task" })
  async remove(
    @Param("id", new ParseUUIDPipe({ version: "4" })) id: string,
  ): Promise<void> {
    return this.taskService.remove(id);
  }

  // 评论相关路由
  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a task' })
  async getComments(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.commentService.findByTaskId(
      id,
      page ? Number(page) : 1,
      pageSize ? Number(pageSize) : 20,
    );
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Create a comment for a task' })
  async createComment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() createCommentDto: any,
    @Request() req: any,
  ) {
    return this.commentService.create(req.user.id, {
      ...createCommentDto,
      taskId: id,
    });
  }

  @Delete(':id/comments/:commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  async deleteComment(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('commentId', new ParseUUIDPipe({ version: '4' })) commentId: string,
    @Request() req: any,
  ) {
    await this.commentService.remove(commentId, req.user.id);
    return { success: true };
  }
}
