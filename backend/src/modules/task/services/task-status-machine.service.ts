import { Injectable, BadRequestException } from "@nestjs/common";
import { TaskStatus } from "../entities/task.entity";

export interface StatusTransitionResult {
  allowed: boolean;
  reason?: string;
}

@Injectable()
export class TaskStatusMachineService {
  private readonly transitionRules: Record<TaskStatus, TaskStatus[]>;

  constructor() {
    // 初始化状态流转规则
    this.transitionRules = {
      [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
      [TaskStatus.IN_PROGRESS]: [TaskStatus.REVIEW, TaskStatus.BLOCKED, TaskStatus.TODO],
      [TaskStatus.REVIEW]: [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
      [TaskStatus.BLOCKED]: [TaskStatus.IN_PROGRESS],
      [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS], // 允许重新打开
    };
  }

  /**
   * 检查状态流转是否合法
   */
  canTransition(from: TaskStatus, to: TaskStatus): StatusTransitionResult {
    // 状态相同时不允许变更
    if (from === to) {
      return {
        allowed: false,
        reason: "状态未发生变化",
      };
    }

    // 检查是否允许流转
    const allowedTargets = this.transitionRules[from];
    if (!allowedTargets || !allowedTargets.includes(to)) {
      return {
        allowed: false,
        reason: `不允许从 ${from} 流转到 ${to}`,
      };
    }

    return { allowed: true };
  }

  /**
   * 获取允许的下一个状态列表
   */
  getNextStatuses(current: TaskStatus): TaskStatus[] {
    return this.transitionRules[current] || [];
  }

  /**
   * 验证状态流转（抛出异常）
   */
  validateTransition(from: TaskStatus, to: TaskStatus): void {
    const result = this.canTransition(from, to);
    if (!result.allowed) {
      throw new BadRequestException(result.reason);
    }
  }

  /**
   * 检查是否需要填写原因
   */
  requireReason(from: TaskStatus, to: TaskStatus): boolean {
    const requireReasonTransitions: Array<[TaskStatus, TaskStatus]> = [
      [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
      [TaskStatus.IN_PROGRESS, TaskStatus.TODO],
      [TaskStatus.REVIEW, TaskStatus.IN_PROGRESS],
      [TaskStatus.DONE, TaskStatus.IN_PROGRESS],
    ];

    return requireReasonTransitions.some(([f, t]) => f === from && t === to);
  }
}
