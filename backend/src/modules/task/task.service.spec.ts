import { Test, TestingModule } from '@nestjs/testing';
import { TaskService } from './task.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';

describe('TaskService', () => {
  let service: TaskService;
  let taskRepository: Repository<Task>;

  const mockTask = {
    id: 'task-001',
    title: '测试任务001',
    description: '测试任务描述',
    status: 'pending',
    priority: 'high',
    progress: 0,
    assigned_agent_id: 'agent-001',
    created_by: 'admin',
    due_date: new Date(Date.now() + 86400000), // 明天
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: getRepositoryToken(Task),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    taskRepository = module.get<Repository<Task>>(getRepositoryToken(Task));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create task successfully', async () => {
      const createTaskDto = {
        title: '测试任务001',
        priority: 'high',
        assigned_agent_id: 'agent-001',
        due_date: new Date(Date.now() + 86400000),
      };

      taskRepository.create.mockReturnValue(mockTask);
      taskRepository.save.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, 'admin');
      expect(result).toBeDefined();
      expect(result.title).toBe('测试任务001');
      expect(taskRepository.save).toHaveBeenCalled();
    });

    it('should throw error if due_date is in the past', async () => {
      const createTaskDto = {
        title: '测试任务001',
        due_date: new Date(Date.now() - 86400000), // 昨天
      };

      await expect(service.create(createTaskDto, 'admin')).rejects.toThrow();
    });
  });

  describe('findAll', () => {
    it('should return array of tasks', async () => {
      const tasks = [mockTask];
      taskRepository.find.mockResolvedValue(tasks);

      const result = await service.findAll();
      expect(result).toEqual(tasks);
      expect(taskRepository.find).toHaveBeenCalled();
    });

    it('should return empty array if no tasks', async () => {
      taskRepository.find.mockResolvedValue([]);

      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return task by id', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne('task-001');
      expect(result).toEqual(mockTask);
      expect(taskRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'task-001' },
      });
    });

    it('should return null if task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update task status', async () => {
      const updateDto = {
        status: 'in_progress',
        progress: 50,
      };

      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.update.mockResolvedValue({ affected: 1 });
      taskRepository.findOne.mockResolvedValue({
        ...mockTask,
        status: 'in_progress',
        progress: 50,
      });

      const result = await service.updateStatus('task-001', updateDto);
      expect(result.status).toBe('in_progress');
      expect(result.progress).toBe(50);
    });

    it('should throw error if progress > 100', async () => {
      const updateDto = {
        progress: 150,
      };

      await expect(
        service.updateStatus('task-001', updateDto),
      ).rejects.toThrow();
    });

    it('should throw error if progress < 0', async () => {
      const updateDto = {
        progress: -10,
      };

      await expect(
        service.updateStatus('task-001', updateDto),
      ).rejects.toThrow();
    });
  });

  describe('completeTask', () => {
    it('should complete task if progress is 100', async () => {
      const taskInProgress = {
        ...mockTask,
        status: 'in_progress',
        progress: 100,
      };

      taskRepository.findOne.mockResolvedValue(taskInProgress);
      taskRepository.update.mockResolvedValue({ affected: 1 });
      taskRepository.findOne.mockResolvedValue({
        ...taskInProgress,
        status: 'completed',
      });

      const result = await service.completeTask('task-001');
      expect(result.status).toBe('completed');
    });

    it('should throw error if progress < 100', async () => {
      const taskInProgress = {
        ...mockTask,
        status: 'in_progress',
        progress: 80,
      };

      taskRepository.findOne.mockResolvedValue(taskInProgress);

      await expect(service.completeTask('task-001')).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete task successfully', async () => {
      taskRepository.findOne.mockResolvedValue(mockTask);
      taskRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete('task-001');
      expect(taskRepository.delete).toHaveBeenCalledWith('task-001');
    });

    it('should throw error if task not found', async () => {
      taskRepository.findOne.mockResolvedValue(null);

      await expect(service.delete('nonexistent')).rejects.toThrow();
    });
  });

  describe('getTasksByAgent', () => {
    it('should return tasks assigned to agent', async () => {
      const agentTasks = [mockTask];
      taskRepository.find.mockResolvedValue(agentTasks);

      const result = await service.getTasksByAgent('agent-001');
      expect(result).toEqual(agentTasks);
      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { assigned_agent_id: 'agent-001' },
      });
    });
  });

  describe('getTasksByStatus', () => {
    it('should return tasks filtered by status', async () => {
      const pendingTasks = [mockTask];
      taskRepository.find.mockResolvedValue(pendingTasks);

      const result = await service.getTasksByStatus('pending');
      expect(result).toEqual(pendingTasks);
      expect(taskRepository.find).toHaveBeenCalledWith({
        where: { status: 'pending' },
      });
    });
  });
});
