import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentDto } from './dto/comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async create(createCommentDto: CreateCommentDto, authorId: string): Promise<Comment> {
    const comment = this.commentRepository.create({
      ...createCommentDto,
      authorId,
    });

    return this.commentRepository.save(comment);
  }

  async findByTask(
    taskId: string,
    options: { page?: number; pageSize?: number } = {},
  ): Promise<{ items: Comment[]; total: number }> {
    const { page = 1, pageSize = 20 } = options;

    const queryBuilder = this.commentRepository
      .createQueryBuilder('comment')
      .leftJoinAndSelect('comment.author', 'author')
      .where('comment.taskId = :taskId', { taskId })
      .orderBy('comment.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

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

  async remove(id: string): Promise<void> {
    const comment = await this.findOne(id);
    await this.commentRepository.remove(comment);
  }
}
