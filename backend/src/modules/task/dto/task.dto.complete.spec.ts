import { UpdateTaskDto, UpdateProgressDto } from './task.dto';

describe('Task DTOs - Complete Coverage', () => {
  describe('UpdateTaskDto', () => {
    it('should create update DTO with partial fields', () => {
      const dto = new UpdateTaskDto();
      dto.title = 'Updated Title';

      expect(dto.title).toBe('Updated Title');
      expect(dto.description).toBeUndefined();
    });
  });

  describe('UpdateProgressDto', () => {
    it('should create progress DTO', () => {
      const dto = new UpdateProgressDto();
      dto.progress = 75;

      expect(dto.progress).toBe(75);
    });

    it('should accept 0 progress', () => {
      const dto = new UpdateProgressDto();
      dto.progress = 0;

      expect(dto.progress).toBe(0);
    });

    it('should accept 100 progress', () => {
      const dto = new UpdateProgressDto();
      dto.progress = 100;

      expect(dto.progress).toBe(100);
    });
  });
});
