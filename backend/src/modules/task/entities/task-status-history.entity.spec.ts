import { TaskStatusHistory, ChangedByType } from "./task-status-history.entity";
import { Task, TaskStatus } from "./task.entity";

describe("TaskStatusHistory", () => {
  it("should create a valid task status history", () => {
    const history = new TaskStatusHistory();
    history.id = "test-id";
    history.taskId = "task-id";
    history.oldStatus = TaskStatus.TODO;
    history.newStatus = TaskStatus.IN_PROGRESS;
    history.changedBy = "user-id";
    history.changedByType = ChangedByType.USER;
    history.reason = "开始处理任务";
    history.changedAt = new Date();

    expect(history.id).toBe("test-id");
    expect(history.taskId).toBe("task-id");
    expect(history.oldStatus).toBe(TaskStatus.TODO);
    expect(history.newStatus).toBe(TaskStatus.IN_PROGRESS);
    expect(history.changedBy).toBe("user-id");
    expect(history.changedByType).toBe(ChangedByType.USER);
    expect(history.reason).toBe("开始处理任务");
    expect(history.changedAt).toBeInstanceOf(Date);
  });

  it("should allow null reason", () => {
    const history = new TaskStatusHistory();
    history.id = "test-id";
    history.taskId = "task-id";
    history.oldStatus = TaskStatus.TODO;
    history.newStatus = TaskStatus.IN_PROGRESS;
    history.changedBy = "user-id";
    history.changedByType = ChangedByType.USER;
    history.reason = null;
    history.changedAt = new Date();

    expect(history.reason).toBeNull();
  });

  it("should handle agent type", () => {
    const history = new TaskStatusHistory();
    history.id = "test-id";
    history.taskId = "task-id";
    history.oldStatus = TaskStatus.IN_PROGRESS;
    history.newStatus = TaskStatus.DONE;
    history.changedBy = "agent-id";
    history.changedByType = ChangedByType.AGENT;
    history.reason = null;
    history.changedAt = new Date();

    expect(history.changedByType).toBe(ChangedByType.AGENT);
  });

  it("should handle all status transitions", () => {
    const transitions: Array<{ from: TaskStatus; to: TaskStatus }> = [
      { from: TaskStatus.TODO, to: TaskStatus.IN_PROGRESS },
      { from: TaskStatus.IN_PROGRESS, to: TaskStatus.REVIEW },
      { from: TaskStatus.IN_PROGRESS, to: TaskStatus.BLOCKED },
      { from: TaskStatus.REVIEW, to: TaskStatus.DONE },
      { from: TaskStatus.BLOCKED, to: TaskStatus.IN_PROGRESS },
      { from: TaskStatus.DONE, to: TaskStatus.IN_PROGRESS },
    ];

    transitions.forEach((transition) => {
      const history = new TaskStatusHistory();
      history.id = `test-id-${transition.from}-${transition.to}`;
      history.taskId = "task-id";
      history.oldStatus = transition.from;
      history.newStatus = transition.to;
      history.changedBy = "user-id";
      history.changedByType = ChangedByType.USER;
      history.changedAt = new Date();

      expect(history.oldStatus).toBe(transition.from);
      expect(history.newStatus).toBe(transition.to);
    });
  });
});

describe("ChangedByType", () => {
  it("should have correct enum values", () => {
    expect(ChangedByType.USER).toBe("user");
    expect(ChangedByType.AGENT).toBe("agent");
  });

  it("should handle user type", () => {
    const type = ChangedByType.USER;
    expect(type).toBe("user");
  });

  it("should handle agent type", () => {
    const type = ChangedByType.AGENT;
    expect(type).toBe("agent");
  });
});
