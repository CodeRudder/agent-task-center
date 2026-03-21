import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Vote, VoteType } from './vote.entity';
import {
  CreateVoteDto,
  VoteResponseDto,
  VoteStatsDto,
} from './vote.dto';

@Injectable()
export class VoteService {
  constructor(
    @InjectRepository(Vote)
    private readonly voteRepository: Repository<Vote>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 对任务投票
   */
  async vote(
    taskId: string,
    userId: string,
    dto: CreateVoteDto,
  ): Promise<VoteResponseDto> {
    const voteType = dto.voteType || VoteType.UPVOTE;

    // 检查是否已经投票
    const existingVote = await this.voteRepository.findOne({
      where: { taskId, userId },
    });

    if (existingVote) {
      // 如果已经投票，更新投票类型
      existingVote.voteType = voteType;
      existingVote.votedAt = new Date();
      await this.voteRepository.save(existingVote);
      return this.toResponseDto(existingVote);
    }

    // 创建新投票
    const vote = this.voteRepository.create({
      taskId,
      userId,
      voteType,
      votedAt: new Date(),
    });

    await this.voteRepository.save(vote);
    return this.toResponseDto(vote);
  }

  /**
   * 取消投票
   */
  async unvote(taskId: string, userId: string): Promise<void> {
    const vote = await this.voteRepository.findOne({
      where: { taskId, userId },
    });

    if (!vote) {
      throw new NotFoundException('Vote not found');
    }

    await this.voteRepository.remove(vote);
  }

  /**
   * 获取任务的投票统计
   */
  async getVoteStats(taskId: string): Promise<VoteStatsDto> {
    const votes = await this.voteRepository.find({
      where: { taskId },
    });

    const upvotes = votes.filter((v) => v.voteType === VoteType.UPVOTE).length;
    const downvotes = votes.filter((v) => v.voteType === VoteType.DOWNVOTE).length;

    return {
      taskId,
      upvotes,
      downvotes,
      totalVotes: votes.length,
      score: upvotes - downvotes,
    };
  }

  /**
   * 获取用户的投票记录
   */
  async getUserVote(
    taskId: string,
    userId: string,
  ): Promise<VoteResponseDto | null> {
    const vote = await this.voteRepository.findOne({
      where: { taskId, userId },
    });

    return vote ? this.toResponseDto(vote) : null;
  }

  /**
   * 转换为响应DTO
   */
  private toResponseDto(vote: Vote): VoteResponseDto {
    return {
      id: vote.id,
      taskId: vote.taskId,
      userId: vote.userId,
      voteType: vote.voteType,
      votedAt: vote.votedAt,
      createdAt: vote.createdAt,
      updatedAt: vote.updatedAt,
    };
  }
}
