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
      const project = this.projectRepository.create({
        ...createProjectDto,
        ownerId: userId,
      });
      await queryRunner.manager.save(project);

      // 自动将创建者添加为项目owner
      const member = this.memberRepository.create({
        projectId: project.id,
        userId: userId,
        role: ProjectMemberRole.OWNER,
      });
      await queryRunner.manager.save(member);

      await queryRunner.commitTransaction();
      
      // 返回完整的项目信息（包括owner信息）
      return (await this.projectRepository.findOne({
        where: { id: project.id },
        relations: ['owner'],
      }))!;
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
  async findAll(userId: string): Promise<Project[]> {
    // 获取用户是成员的所有项目
    const members = await this.memberRepository.find({
      where: { userId },
      relations: ['project', 'project.owner'],
    });

    return members.map(member => member.project);
  }

  /**
   * 获取项目详情
   */
  async findOne(userId: string, projectId: string): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['owner', 'members', 'members.user'],
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

    return (await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['owner'],
    }))!;
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

    // 检查权限：只有owner可以删除
    if (project.ownerId !== userId) {
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
    userId: string,
    projectId: string,
    memberId: string,
  ): Promise<void> {
    // 检查权限：只有owner和admin可以移除成员
    const currentMember = await this.memberRepository.findOne({
      where: { projectId, userId },
    });

    if (!currentMember || (currentMember.role !== ProjectMemberRole.OWNER && currentMember.role !== ProjectMemberRole.ADMIN)) {
      throw new ForbiddenException('无权移除项目成员');
    }

    // 查找要移除的成员
    const member = await this.memberRepository.findOne({
      where: { id: memberId, projectId },
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

    // 获取项目的任务列表
    return await this.taskRepository.find({
      where: { projectId },
      relations: ['assignee', 'creator'],
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

    // 获取项目成员列表
    return await this.memberRepository.find({
      where: { projectId },
      relations: ['user'],
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
