import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ReportsService } from '../services/reports.service';
import { TrendQueryDto } from '../dto/trend-query.dto';
import { ComparisonQueryDto } from '../dto/comparison-query.dto';
import { RisksQueryDto } from '../dto/risks-query.dto';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('trend')
  @ApiOperation({ summary: 'Get trend analysis' })
  @ApiResponse({ status: 200, description: 'Trend analysis retrieved successfully' })
  @ApiQuery({ name: 'timeRange', required: false })
  @ApiQuery({ name: 'metrics', required: false })
  async getTrend(@Query() query: TrendQueryDto) {
    return this.reportsService.getTrendAnalysis(query.timeRange || '30d', query.metrics || 'completed,overdue');
  }

  @Get('comparison')
  @ApiOperation({ summary: 'Get comparison analysis' })
  @ApiResponse({ status: 200, description: 'Comparison analysis retrieved successfully' })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'timeRange', required: false })
  async getComparison(@Query() query: ComparisonQueryDto) {
    return this.reportsService.getComparisonAnalysis(query.type || 'team', query.timeRange || '30d');
  }

  @Get('risks')
  @ApiOperation({ summary: 'Get risk analysis' })
  @ApiResponse({ status: 200, description: 'Risk analysis retrieved successfully' })
  @ApiQuery({ name: 'level', required: false })
  async getRisks(@Query() query: RisksQueryDto) {
    return this.reportsService.getRiskAnalysis(query.level || 'high,medium,low');
  }
}
