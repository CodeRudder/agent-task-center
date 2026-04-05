import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CommentService } from './comment.service';
import { Comment } from './entities/comment.entity';
import { CommentMention } from './entities/comment-mention.entity';
import { CommentHistory } from './entities/comment-history.entity';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateCommentDto, UpdateCommentDto } from './dto/comment.dto';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/entities/user.entity';
import { Task } from '../task/entities/task.entity';

describe('CommentService', () => {
  let service: CommentService;
  let commentRepository: Repository<Comment>;
  let mentionRepository: Repository<CommentMention>;
  let historyRepository: Repository<CommentHistory>;
  let dataSource: DataSource;
  let notificationService: NotificationService;

  const mockTaskId = '123e4567-e89b-12d3-a456-426614174000';
  const mockCommentId = '123e4567-e89b-12d3-a456-426614174001';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174002';
  const mockMentionedUserId = '123e4567-e89b-12d3-a456-426614174003';

  const mockTask = {
    id: mockTaskId,
    title: 'Test Task',
  } as any;

  const mockComment = {
    id: mockCommentId,
    content: 'Great work on this task!',
    taskId: mockTaskId,
    task: mockTask,
    authorId: mockUserId,
    author: {
      id: mockUserId,
      username: 'testuser',
      email: 'test@example.com',
    } as any,
    isEdited: false,
    parentId: null,
    parent: null,
    mentions: [],
    histories: [],
    replies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  } as unknown as Comment;

  const mockCreateCommentDto: CreateCommentDto = {
    taskId: mockTaskId,
    content: 'Great work on this task!',
  };

  const mockUpdateCommentDto: UpdateCommentDto = {
    content: 'Updated comment content',
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn((cb) => {
      const mockManager = {
        create: jest.fn(),
        save: jest.fn(),
      };
      return cb(mockManager);
    }),
  };

  const mockNotificationService = {
    createCommentAddedNotification: jest.fn(),
    createCommentMentionNotification: jest.fn(),
    createCommentReplyNotification: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockTaskRepository = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(CommentMention),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(CommentHistory),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(Task),
          useValue: mockTaskRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: NotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    service = module.get<CommentService>(CommentService);
    notificationService = module.get<NotificationService>(NotificationService);
    commentRepository = module.get<Repository<Comment>>(getRepositoryToken(Comment));
    mentionRepository = module.get<Repository<CommentMention>>(getRepositoryToken(CommentMention));
    historyRepository = module.get<Repository<CommentHistory>>(getRepositoryToken(CommentHistory));
    dataSource = module.get<DataSource>(DataSource);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a comment successfully', async () => {
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          create: jest.fn().mockReturnValue(mockComment),
          save: jest.fn().mockResolvedValue(mockComment),
        };
        return cb(mockManager);
      });

      const result = await service.create(mockUserId, mockCreateCommentDto);

      expect(result).toEqual(mockComment);
    });

    it('should create a comment with mentions', async () => {
      const createDtoWithMentions: CreateCommentDto = {
        ...mockCreateCommentDto,
        mentions: [mockMentionedUserId],
      };

      const commentWithMentions = {
        ...mockComment,
        mentions: [{ mentionedUserId: mockMentionedUserId }],
      };

      mockDataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          create: jest.fn()
            .mockReturnValueOnce(mockComment)
            .mockReturnValueOnce({ mentionedUserId: mockMentionedUserId }),
          save: jest.fn()
            .mockResolvedValueOnce(mockComment)
            .mockResolvedValueOnce([{ mentionedUserId: mockMentionedUserId }]),
        };
        return cb(mockManager);
      });

      const result = await service.create(mockUserId, createDtoWithMentions);

      expect(result).toBeDefined();
    });

    it('should create a reply comment with parentId', async () => {
      const createReplyDto: CreateCommentDto = {
        ...mockCreateCommentDto,
        parentId: mockCommentId,
      };

      const replyComment = {
        ...mockComment,
        parentId: mockCommentId,
      };

      mockDataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          create: jest.fn().mockReturnValue(replyComment),
          save: jest.fn().mockResolvedValue(replyComment),
        };
        return cb(mockManager);
      });

      const result = await service.create(mockUserId, createReplyDto);

      expect(result).toBeDefined();
    });
  });

  describe('findByTaskId', () => {
    it('should return paginated comments for a task', async () => {
      const mockResult = {
        items: [mockComment],
        total: 1,
      };

      mockRepository.findAndCount.mockResolvedValue([[mockComment], 1]);

      const result = await service.findByTaskId(mockTaskId, 1, 20);

      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
      expect(result.comments).toEqual([mockComment]);
    });

    it('should return empty array when no comments exist', async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.findByTaskId(mockTaskId, 1, 20);

      expect(result.total).toBe(0);
      expect(result.comments).toEqual([]);
    });

    it('should handle pagination correctly', async () => {
      const comments = Array(10).fill(mockComment);
      mockRepository.findAndCount.mockResolvedValue([comments, 25]);

      const result = await service.findByTaskId(mockTaskId, 2, 10);

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(25);
    });
  });

  describe('findOne', () => {
    it('should return a comment by id', async () => {
      mockRepository.findOne.mockResolvedValue(mockComment);

      const result = await service.findOne(mockCommentId);

      expect(result).toEqual(mockComment);
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(mockCommentId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a comment successfully', async () => {
      const updatedComment = {
        ...mockComment,
        content: 'Updated content',
        isEdited: true,
      };

      mockRepository.findOne.mockResolvedValue(mockComment);
      
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          create: jest.fn().mockReturnValue({}),
          save: jest.fn()
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce(updatedComment),
        };
        return cb(mockManager);
      });

      const result = await service.update(mockUserId, mockCommentId, mockUpdateCommentDto);

      expect(result).toBeDefined();
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update(mockUserId, mockCommentId, mockUpdateCommentDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      mockRepository.findOne.mockResolvedValue(mockComment);

      await expect(
        service.update('different-user-id', mockCommentId, mockUpdateCommentDto)
      ).rejects.toThrow(ForbiddenException);
    });

    it('should record edit history when updating', async () => {
      mockRepository.findOne.mockResolvedValue(mockComment);
      
      mockDataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          create: jest.fn().mockReturnValue({}),
          save: jest.fn()
            .mockResolvedValueOnce({})  // history
            .mockResolvedValueOnce({    // comment
              ...mockComment,
              content: 'Updated comment content',
              updatedAt: new Date(),
            }),
        };
        return cb(mockManager);
      });

      const result = await service.update(mockUserId, mockCommentId, mockUpdateCommentDto);

      expect(result.content).toBe('Updated comment content');
      expect(result.updatedAt).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should soft delete a comment successfully', async () => {
      mockRepository.findOne.mockResolvedValue(mockComment);
      mockRepository.softDelete.mockResolvedValue({ affected: 1 });

      await service.remove(mockUserId, mockCommentId);

      expect(mockRepository.softDelete).toHaveBeenCalledWith(mockCommentId);
    });

    it('should throw NotFoundException when comment does not exist', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(mockUserId, mockCommentId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException when user is not the author', async () => {
      mockRepository.findOne.mockResolvedValue(mockComment);

      await expect(
        service.remove('different-user-id', mockCommentId)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('parseMentions', () => {
    it('should parse mentions from content', () => {
      const content = '@user1 @user2 please review this task';
      const mentions = service.parseMentions(content);

      expect(mentions).toEqual(['user1', 'user2']);
    });

    it('should return empty array when no mentions', () => {
      const content = 'This is a comment without mentions';
      const mentions = service.parseMentions(content);

      expect(mentions).toEqual([]);
    });

    it('should handle special characters in mentions', () => {
      const content = '@user_name-123 @test.user please check';
      const mentions = service.parseMentions(content);

      expect(mentions).toContain('user_name-123');
      expect(mentions).toContain('test.user');
    });

    it('should handle duplicate mentions', () => {
      const content = '@user1 @user1 @user2';
      const mentions = service.parseMentions(content);

      expect(mentions).toEqual(['user1', 'user1', 'user2']);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long comment content', async () => {
      const longContent = 'a'.repeat(5000);
      const longCommentDto: CreateCommentDto = {
        taskId: mockTaskId,
        content: longContent,
      };

      const longComment = {
        ...mockComment,
        content: longContent,
      };

      mockDataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          create: jest.fn().mockReturnValue(longComment),
          save: jest.fn().mockResolvedValue(longComment),
        };
        return cb(mockManager);
      });

      const result = await service.create(mockUserId, longCommentDto);

      expect(result.content).toBe(longContent);
    });

    it('should handle special characters in content', async () => {
      const specialContent = 'Test with <script>alert("xss")</script> & "quotes"';
      const specialCommentDto: CreateCommentDto = {
        taskId: mockTaskId,
        content: specialContent,
      };

      const specialComment = {
        ...mockComment,
        content: specialContent,
      };

      mockDataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          create: jest.fn().mockReturnValue(specialComment),
          save: jest.fn().mockResolvedValue(specialComment),
        };
        return cb(mockManager);
      });

      const result = await service.create(mockUserId, specialCommentDto);

      expect(result.content).toBe(specialContent);
    });

    it('should handle empty mentions array', async () => {
      const createDtoWithEmptyMentions: CreateCommentDto = {
        ...mockCreateCommentDto,
        mentions: [],
      };

      mockDataSource.transaction.mockImplementation(async (cb) => {
        const mockManager = {
          create: jest.fn().mockReturnValue(mockComment),
          save: jest.fn().mockResolvedValue(mockComment),
        };
        return cb(mockManager);
      });

      const result = await service.create(mockUserId, createDtoWithEmptyMentions);

      expect(result).toEqual(mockComment);
    });
  });
});
