import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException } from "@nestjs/common";
import { TaskStatusMachineService } from "./task-status-machine.service";
import { TaskStatus } from "../entities/task.entity";

describe("TaskStatusMachineService", () => {
  let service: TaskStatusMachineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskStatusMachineService],
    }).compile();

    service = module.get<TaskStatusMachineService>(TaskStatusMachineService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("canTransition", () => {
    it("should allow transition from TODO to IN_PROGRESS", () => {
      const result = service.canTransition(TaskStatus.TODO, TaskStatus.IN_PROGRESS);
      expect(result.allowed).toBe(true);
    });

    it("should allow transition from IN_PROGRESS to REVIEW", () => {
      const result = service.canTransition(TaskStatus.IN_PROGRESS, TaskStatus.REVIEW);
      expect(result.allowed).toBe(true);
    });

    it("should allow transition from IN_PROGRESS to BLOCKED", () => {
      const result = service.canTransition(TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED);
      expect(result.allowed).toBe(true);
    });

    it("should allow transition from IN_PROGRESS to TODO", () => {
      const result = service.canTransition(TaskStatus.IN_PROGRESS, TaskStatus.TODO);
      expect(result.allowed).toBe(true);
    });

    it("should allow transition from REVIEW to DONE", () => {
      const result = service.canTransition(TaskStatus.REVIEW, TaskStatus.DONE);
      expect(result.allowed).toBe(true);
    });

    it("should allow transition from REVIEW to IN_PROGRESS", () => {
      const result = service.canTransition(TaskStatus.REVIEW, TaskStatus.IN_PROGRESS);
      expect(result.allowed).toBe(true);
    });

    it("should allow transition from BLOCKED to IN_PROGRESS", () => {
      const result = service.canTransition(TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS);
      expect(result.allowed).toBe(true);
    });

    it("should allow transition from DONE to IN_PROGRESS", () => {
      const result = service.canTransition(TaskStatus.DONE, TaskStatus.IN_PROGRESS);
      expect(result.allowed).toBe(true);
    });

    it("should not allow transition with same status", () => {
      const result = service.canTransition(TaskStatus.TODO, TaskStatus.TODO);
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe("状态未发生变化");
    });

    it("should not allow transition from TODO to DONE", () => {
      const result = service.canTransition(TaskStatus.TODO, TaskStatus.DONE);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain("不允许从 todo 流转到 done");
    });

    it("should not allow transition from DONE to BLOCKED", () => {
      const result = service.canTransition(TaskStatus.DONE, TaskStatus.BLOCKED);
      expect(result.allowed).toBe(false);
    });

    it("should not allow transition from BLOCKED to DONE", () => {
      const result = service.canTransition(TaskStatus.BLOCKED, TaskStatus.DONE);
      expect(result.allowed).toBe(false);
    });

    it("should not allow transition from TODO to REVIEW", () => {
      const result = service.canTransition(TaskStatus.TODO, TaskStatus.REVIEW);
      expect(result.allowed).toBe(false);
    });

    it("should not allow transition from REVIEW to BLOCKED", () => {
      const result = service.canTransition(TaskStatus.REVIEW, TaskStatus.BLOCKED);
      expect(result.allowed).toBe(false);
    });

    it("should not allow transition from REVIEW to TODO", () => {
      const result = service.canTransition(TaskStatus.REVIEW, TaskStatus.TODO);
      expect(result.allowed).toBe(false);
    });
  });

  describe("getNextStatuses", () => {
    it("should return correct next statuses for TODO", () => {
      const nextStatuses = service.getNextStatuses(TaskStatus.TODO);
      expect(nextStatuses).toEqual([TaskStatus.IN_PROGRESS]);
    });

    it("should return correct next statuses for IN_PROGRESS", () => {
      const nextStatuses = service.getNextStatuses(TaskStatus.IN_PROGRESS);
      expect(nextStatuses).toContain(TaskStatus.REVIEW);
      expect(nextStatuses).toContain(TaskStatus.BLOCKED);
      expect(nextStatuses).toContain(TaskStatus.TODO);
      expect(nextStatuses.length).toBe(3);
    });

    it("should return correct next statuses for REVIEW", () => {
      const nextStatuses = service.getNextStatuses(TaskStatus.REVIEW);
      expect(nextStatuses).toContain(TaskStatus.DONE);
      expect(nextStatuses).toContain(TaskStatus.IN_PROGRESS);
      expect(nextStatuses.length).toBe(2);
    });

    it("should return correct next statuses for BLOCKED", () => {
      const nextStatuses = service.getNextStatuses(TaskStatus.BLOCKED);
      expect(nextStatuses).toEqual([TaskStatus.IN_PROGRESS]);
    });

    it("should return correct next statuses for DONE", () => {
      const nextStatuses = service.getNextStatuses(TaskStatus.DONE);
      expect(nextStatuses).toEqual([TaskStatus.IN_PROGRESS]);
    });
  });

  describe("validateTransition", () => {
    it("should not throw for valid transition", () => {
      expect(() => {
        service.validateTransition(TaskStatus.TODO, TaskStatus.IN_PROGRESS);
      }).not.toThrow();
    });

    it("should throw BadRequestException for invalid transition", () => {
      expect(() => {
        service.validateTransition(TaskStatus.TODO, TaskStatus.DONE);
      }).toThrow(BadRequestException);
    });

    it("should throw BadRequestException for same status", () => {
      expect(() => {
        service.validateTransition(TaskStatus.TODO, TaskStatus.TODO);
      }).toThrow(BadRequestException);
    });
  });

  describe("requireReason", () => {
    it("should require reason for IN_PROGRESS to BLOCKED", () => {
      const required = service.requireReason(TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED);
      expect(required).toBe(true);
    });

    it("should require reason for IN_PROGRESS to TODO", () => {
      const required = service.requireReason(TaskStatus.IN_PROGRESS, TaskStatus.TODO);
      expect(required).toBe(true);
    });

    it("should require reason for REVIEW to IN_PROGRESS", () => {
      const required = service.requireReason(TaskStatus.REVIEW, TaskStatus.IN_PROGRESS);
      expect(required).toBe(true);
    });

    it("should require reason for DONE to IN_PROGRESS", () => {
      const required = service.requireReason(TaskStatus.DONE, TaskStatus.IN_PROGRESS);
      expect(required).toBe(true);
    });

    it("should not require reason for TODO to IN_PROGRESS", () => {
      const required = service.requireReason(TaskStatus.TODO, TaskStatus.IN_PROGRESS);
      expect(required).toBe(false);
    });

    it("should not require reason for IN_PROGRESS to REVIEW", () => {
      const required = service.requireReason(TaskStatus.IN_PROGRESS, TaskStatus.REVIEW);
      expect(required).toBe(false);
    });

    it("should not require reason for REVIEW to DONE", () => {
      const required = service.requireReason(TaskStatus.REVIEW, TaskStatus.DONE);
      expect(required).toBe(false);
    });

    it("should not require reason for BLOCKED to IN_PROGRESS", () => {
      const required = service.requireReason(TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS);
      expect(required).toBe(false);
    });
  });
});
