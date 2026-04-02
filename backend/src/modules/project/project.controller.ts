import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProjectService } from './project.service';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto } from './dto';

interface RequestWithUser extends Request {
  user: {
    id: string;
  };
}

@ApiTags('项目管理')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  @ApiOperation({ summary: '创建项目' })
  async create(@Request() req: RequestWithUser, @Body() createProjectDto: CreateProjectDto) {
    return await this.projectService.create(req.user.id, createProjectDto);
  }

  @Get()
  @ApiOperation({ summary: '获取项目列表' })
  async findAll(
    @Request() req: RequestWithUser,
    @Query('status') status?: string,
  ) {
    return await this.projectService.findAll(req.user.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取项目详情' })
  async findOne(@Request() req: RequestWithUser, @Param('id') id: string) {
    return await this.projectService.findOne(req.user.id, id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新项目' })
  async update(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return await this.projectService.update(req.user.id, id, updateProjectDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '更新项目状态' })
  async updateStatus(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return await this.projectService.updateStatus(req.user.id, id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除项目' })
  async remove(@Request() req: RequestWithUser, @Param('id') id: string) {
    await this.projectService.remove(req.user.id, id);
    return { message: '项目删除成功' };
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: '获取项目的任务列表' })
  async getTasks(@Request() req: RequestWithUser, @Param('id') id: string) {
    return await this.projectService.getTasks(req.user.id, id);
  }

  @Post(':id/members')
  @ApiOperation({ summary: '添加项目成员' })
  async addMember(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() addMemberDto: AddMemberDto,
  ) {
    return await this.projectService.addMember(req.user.id, id, addMemberDto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: '移除项目成员' })
  async removeMember(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    await this.projectService.removeMember(req.user.id, id, userId);
    return { message: '成员移除成功' };
  }

  @Get(':id/members')
  @ApiOperation({ summary: '查询项目成员列表' })
  async getMembers(@Request() req: RequestWithUser, @Param('id') id: string) {
    return await this.projectService.getMembers(req.user.id, id);
  }
}
