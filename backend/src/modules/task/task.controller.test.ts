import { Controller, Post, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, Length } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator';

/**
 * 测试DTO - 用于验证参数验证是否返回400
 */
class TestValidationDto {
  @IsString()
  @Length(1, 100, { message: '任务标题必须在1到100个字符之间' })
  title: string;
}

/**
 * 测试Controller - 用于验证参数验证是否返回400
 * 
 * 这个端点是公开的，不需要认证，用于测试参数验证
 */
@ApiTags('test')
@Controller('test')
export class TestValidationController {
  @Post('validation')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: '测试参数验证（公开端点，无需认证）' })
  async testValidation(@Body() dto: TestValidationDto) {
    return {
      success: true,
      message: '验证通过',
      data: dto,
    };
  }
}
