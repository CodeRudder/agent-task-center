import { ApiProperty } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  @ApiProperty({ description: '数据列表' })
  items: T[];

  @ApiProperty({ description: '总数', required: false })
  total?: number;
}
