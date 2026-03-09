import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async create(taskId: string, authorId: string, createCommentDto: CreateCommentDto): Promise<Comment> {
    const comment = this.commentRepository.create({
      ...createCommentDto,
      taskId,
      authorId,
    });

    return this.commentRepository.save(comment);
  }

  async findAllByTask(taskId: string, page: number = 1, pageSize: number = 20): Promise<{ items: Comment[]; total: number }> {
    const [items, total] = await this.commentRepository.findAndCount({
      where: { taskId },
      relations: ['author'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, total };
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    return comment;
  }

  async update(id: string, userId: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOne(id);

    // Only author can update their comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    await this.commentRepository.update(id, updateCommentDto);
    return this.findOne(id);
  }

  async remove(id: string, userId: string): Promise<void> {
    const comment = await this.findOne(id);

    // Only author can delete their comment
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    await this.commentRepository.delete(id);
  }
}
