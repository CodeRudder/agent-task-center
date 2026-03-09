import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from '../src/modules/comment/comment.controller';
import { CommentService } from '../src/modules/comment/comment.service';
import { ApiTokenService } from '../src/modules/agents/services/api-token.service';
import { JwtService } from '@nestjs/jwt';
import { CreateCommentDto, QueryCommentsDto } from '../src/modules/comment/dto/comment.dto';

describe('CommentController', () => {
  let controller: CommentController;
  let service: CommentService;

  const mockTaskId = '123e4567-e89b-12d3-a456-426614174000';
  const mockCommentId = '123e4567-e89b-12d3-a456-426614174001';
  const mockUserId = '123e4567-e89b-12d3-a456-426614174002';

  const mockComment = {
    id: mockCommentId,
    content: 'Great work on this task!',
    taskId: mockTaskId,
    authorId: mockUserId,
    author: {
      id: mockUserId,
      name: 'Test User',
      email: 'test@example.com',
    },
    mentions: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: { id: mockUserId },
  };

  const mockService = {
    create: jest.fn(),
    findByTask: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockApiTokenService = {
    validateApiToken: jest.fn(),
  };

  const mockJwtService = {
    verify: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: mockService,
        },
        {
          provide: ApiTokenService,
          useValue: mockApiTokenService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    })
      .overrideGuard(require('../src/modules/auth/guards/api-token.guard'))
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(require('../src/modules/auth/guards/permissions.guard'))
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<CommentController>(CommentController);
    service = module.get<CommentService>(CommentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('addComment', () => {
    it('should create comment successfully', async () => {
      const createCommentDto: CreateCommentDto = {
        content: 'Great work on this task!',
        taskId: mockTaskId,
      };

      mockService.create.mockResolvedValue(mockComment);

      const result = await controller.addComment(
        mockTaskId,
        createCommentDto,
        mockRequest,
      );

      expect(mockService.create).toHaveBeenCalledWith(
        createCommentDto,
        mockUserId,
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockComment);
      expect(result.message).toBe('评论添加成功');
    });

    it('should override taskId in body with URL param', async () => {
      const createCommentDto: CreateCommentDto = {
        content: 'Test comment',
        taskId: 'different-task-id',
      };

      mockService.create.mockResolvedValue(mockComment);

      await controller.addComment(mockTaskId, createCommentDto, mockRequest);

      expect(createCommentDto.taskId).toBe(mockTaskId);
      expect(mockService.create).toHaveBeenCalledWith(
        expect.objectContaining({ taskId: mockTaskId }),
        mockUserId,
      );
    });

    it('should create comment with mentions', async () => {
      const createCommentDto: CreateCommentDto = {
        content: '@user1 please review',
        taskId: mockTaskId,
        mentions: [
          {
            userId: 'user-1',
            position: { start: 0, end: 6 },
          },
        ],
      };

      const commentWithMentions = {
        ...mockComment,
        content: '@user1 please review',
        mentions: createCommentDto.mentions,
      };

      mockService.create.mockResolvedValue(commentWithMentions);

      const result = await controller.addComment(
        mockTaskId,
        createCommentDto,
        mockRequest,
      );

      expect(result.success).toBe(true);
      expect(result.data.mentions).toHaveLength(1);
    });

    it('should include timestamp in response', async () => {
      const createCommentDto: CreateCommentDto = {
        content: 'Test',
        taskId: mockTaskId,
      };

      mockService.create.mockResolvedValue(mockComment);

      const result = await controller.addComment(
        mockTaskId,
        createCommentDto,
        mockRequest,
      );

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('getComments', () => {
    it('should get comments list successfully', async () => {
      const query: QueryCommentsDto = { page: 1, pageSize: 20 };
      const mockResult = {
        items: [mockComment],
        total: 1,
      };

      mockService.findByTask.mockResolvedValue(mockResult);

      const result = await controller.getComments(mockTaskId, query, mockRequest);

      expect(mockService.findByTask).toHaveBeenCalledWith(mockTaskId, {
        page: 1,
        pageSize: 20,
      });
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult);
    });

    it('should return paginated results', async () => {
      const query: QueryCommentsDto = { page: 2, pageSize: 10 };
      const comments = Array(10)
        .fill(null)
        .map((_, i) => ({
          ...mockComment,
          id: `comment-${i}`,
          content: `Comment ${i}`,
        }));

      const mockResult = {
        items: comments,
        total: 25,
      };

      mockService.findByTask.mockResolvedValue(mockResult);

      const result = await controller.getComments(mockTaskId, query, mockRequest);

      expect(result.data.items).toHaveLength(10);
      expect(result.data.total).toBe(25);
    });

    it('should handle empty results', async () => {
      const query: QueryCommentsDto = { page: 1, pageSize: 20 };
      const mockResult = {
        items: [],
        total: 0,
      };

      mockService.findByTask.mockResolvedValue(mockResult);

      const result = await controller.getComments(mockTaskId, query, mockRequest);

      expect(result.data.items).toHaveLength(0);
      expect(result.data.total).toBe(0);
    });

    it('should use default pagination values', async () => {
      const query: QueryCommentsDto = {};
      const mockResult = {
        items: [mockComment],
        total: 1,
      };

      mockService.findByTask.mockResolvedValue(mockResult);

      await controller.getComments(mockTaskId, query, mockRequest);

      expect(mockService.findByTask).toHaveBeenCalledWith(mockTaskId, {
        page: undefined,
        pageSize: undefined,
      });
    });

    it('should include timestamp in response', async () => {
      const query: QueryCommentsDto = {};
      const mockResult = {
        items: [mockComment],
        total: 1,
      };

      mockService.findByTask.mockResolvedValue(mockResult);

      const result = await controller.getComments(mockTaskId, query, mockRequest);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long comment content', async () => {
      const longContent = 'a'.repeat(5000);
      const createCommentDto: CreateCommentDto = {
        content: longContent,
        taskId: mockTaskId,
      };

      const longComment = {
        ...mockComment,
        content: longContent,
      };

      mockService.create.mockResolvedValue(longComment);

      const result = await controller.addComment(
        mockTaskId,
        createCommentDto,
        mockRequest,
      );

      expect(result.success).toBe(true);
      expect(result.data.content).toBe(longContent);
    });

    it('should handle special characters in content', async () => {
      const specialContent = 'Test with <script>alert("xss")</script> & "quotes"';
      const createCommentDto: CreateCommentDto = {
        content: specialContent,
        taskId: mockTaskId,
      };

      const specialComment = {
        ...mockComment,
        content: specialContent,
      };

      mockService.create.mockResolvedValue(specialComment);

      const result = await controller.addComment(
        mockTaskId,
        createCommentDto,
        mockRequest,
      );

      expect(result.success).toBe(true);
      expect(result.data.content).toBe(specialContent);
    });
  });
});
