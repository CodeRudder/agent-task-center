import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Project, ProjectMember, ProjectMemberRole } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto, AddMemberDto } from './dto';
import { User } from '../user/entities/user.entity';
import { Task } from '../task/entities/task.entity';

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly memberRepository: Repository<ProjectMember>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 创建项目
   */
  async create(userId: string, createProjectDto: CreateProjectDto): Promise<Project> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 创建项目
      const project = new Project();
      project.name = createProjectDto.name;
      project.description = createProjectDto.description || '';
      project.status = createProjectDto.status || 'active';
      project.startDate = createProjectDto.startDate ? new Date(createProjectDto.startDate) : null;
      project.endDate = createProjectDto.endDate ? new Date(createProjectDto.endDate) : null;
      project.ownerId = userId;

      const savedProject = await queryRunner.manager.save(project);

      // 自动将创建者添加为项目owner
      const member = new ProjectMember();
      member.projectId = savedProject.id;
      member.userId = userId;
      member.role = ProjectMemberRole.OWNER;

      await queryRunner.manager.save(member);

      await queryRunner.commitTransaction();

      // 返回项目信息（ADR-002: 移除关联查询）
      const resultProject = await this.projectRepository.findOne({
        where: { id: savedProject.id },
      });
      return resultProject!;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * 获取用户的项目列表
   */
  async findAll(userId: string, status?: string): Promise<Project[]> {
    // 获取用户是成员的所有项目ID（ADR-002: 移除关联查询）
    const members = await this.memberRepository.find({
      where: { userId },
    });

    const projectIds = members.map(member => member.projectId);

    // 构建查询条件
    const whereCondition: any = { id: { $in: projectIds } as any };

    // 如果提供了status参数，添加过滤条件
    if (status) {
      whereCondition.status = status;
    }

    // 手动查询项目
    const projects = await this.projectRepository.find({
      where: whereCondition,
    });

    return projects;
  }

  /**
   * 获取项目详情
   */
  async findOne(userId: string, projectId: string): Promise<Project> {
    // ADR-002: 移除关联查询
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 检查用户是否是项目成员
    const isMember = await this.isMember(userId, projectId);
    if (!isMember) {
      throw new ForbiddenException('无权访问该项目');
    }

    return project;
  }

  /**
   * 更新项目
   */
  async update(
    userId: string,
    projectId: string,
    updateProjectDto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 检查权限：只有owner和admin可以更新
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });

    if (!member || (member.role !== ProjectMemberRole.OWNER && member.role !== ProjectMemberRole.ADMIN)) {
      throw new ForbiddenException('无权更新该项目');
    }

    // 更新项目
    Object.assign(project, updateProjectDto);
    await this.projectRepository.save(project);

    // ADR-002: 移除关联查询
    const updatedProject = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!updatedProject) {
      throw new NotFoundException('项目不存在');
    }

    return updatedProject;
  }

  /**
   * 更新项目状态
   */
  async updateStatus(
    userId: string,
    projectId: string,
    status: string,
  ): Promise<Project> {
    // 验证状态值
    const validStatuses = ['active', 'archived', 'deleted'];
    if (!validStatuses.includes(status)) {
      throw new ForbiddenException('无效的状态值');
    }

    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 检查权限：只有owner和admin可以更新状态
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });

    if (!member || (member.role !== ProjectMemberRole.OWNER && member.role !== ProjectMemberRole.ADMIN)) {
      throw new ForbiddenException('无权更新项目状态');
    }

    // 更新状态
    project.status = status;
    await this.projectRepository.save(project);

    // ADR-002: 移除关联查询
    const updatedProject = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!updatedProject) {
      throw new NotFoundException('项目不存在');
    }

    return updatedProject;
  }

  /**
   * 删除项目
   */
  async remove(userId: string, projectId: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 检查权限：owner和admin都可以删除
    const member = await this.memberRepository.findOne({
      where: { projectId, userId },
    });

    if (!member || (member.role !== ProjectMemberRole.OWNER && member.role !== ProjectMemberRole.ADMIN)) {
      throw new ForbiddenException('无权删除该项目');
    }

    // 软删除项目
    await this.projectRepository.softDelete(projectId);
  }

  /**
   * 添加项目成员
   */
  async addMember(
    userId: string,
    projectId: string,
    addMemberDto: AddMemberDto,
  ): Promise<ProjectMember> {
    // 检查项目是否存在
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    // 检查权限：只有owner和admin可以添加成员
    const currentMember = await this.memberRepository.findOne({
      where: { projectId, userId },
    });

    if (!currentMember || (currentMember.role !== ProjectMemberRole.OWNER && currentMember.role !== ProjectMemberRole.ADMIN)) {
      throw new ForbiddenException('无权添加项目成员');
    }

    // 检查用户是否存在
    const user = await this.userRepository.findOne({
      where: { id: addMemberDto.userId },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 检查是否已经是成员
    const existingMember = await this.memberRepository.findOne({
      where: { projectId, userId: addMemberDto.userId },
    });

    if (existingMember) {
      throw new ForbiddenException('用户已经是项目成员');
    }

    // 添加成员
    const member = this.memberRepository.create({
      projectId,
      ...addMemberDto,
    });

    return await this.memberRepository.save(member);
  }

  /**
   * 移除项目成员
   */
  async removeMember(
    currentUserId: string,
    projectId: string,
    targetUserId: string,
  ): Promise<void> {
    // 检查权限：只有owner和admin可以移除成员
    const currentMember = await this.memberRepository.findOne({
      where: { projectId, userId: currentUserId },
    });

    if (!currentMember || (currentMember.role !== ProjectMemberRole.OWNER && currentMember.role !== ProjectMemberRole.ADMIN)) {
      throw new ForbiddenException('无权移除项目成员');
    }

    // 查找要移除的成员（通过userId）
    const member = await this.memberRepository.findOne({
      where: { projectId, userId: targetUserId },
    });

    if (!member) {
      throw new NotFoundException('成员不存在');
    }

    // 不能移除owner
    if (member.role === ProjectMemberRole.OWNER) {
      throw new ForbiddenException('无法移除项目所有者');
    }

    await this.memberRepository.remove(member);
  }

  /**
   * 获取项目的任务列表
   */
  async getTasks(userId: string, projectId: string) {
    // 检查权限
    const isMember = await this.isMember(userId, projectId);
    if (!isMember) {
      throw new ForbiddenException('无权访问该项目');
    }

    // 获取项目的任务列表（ADR-002: 移除关联查询）
    return await this.taskRepository.find({
      where: { projectId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 查询项目成员列表
   */
  async getMembers(userId: string, projectId: string) {
    // 检查权限
    const isMember = await this.isMember(userId, projectId);
    if (!isMember) {
      throw new ForbiddenException('无权访问该项目');
    }

    // 获取项目成员列表（ADR-002: 移除关联查询）
    return await this.memberRepository.find({
      where: { projectId },
      order: { joinedAt: 'DESC' },
    });
  }

  /**
   * 检查用户是否是项目成员
   */
  private async isMember(userId: string, projectId: string): Promise<boolean> {
    const member = await this.memberRepository.findOne({
      where: { userId, projectId },
    });
    return !!member;
  }
}
