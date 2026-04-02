import { Controller, Get, Post, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ReportsService } from '../services/reports.service';
import { TrendQueryDto } from '../dto/trend-query.dto';
import { ComparisonQueryDto } from '../dto/comparison-query.dto';
import { RisksQueryDto } from '../dto/risks-query.dto';
import { ExportQueryDto } from '../dto/export-query.dto';
import { CustomReportDto } from '../dto/custom-report.dto';

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

  @Get('export')
  @ApiOperation({ summary: 'Export report' })
  @ApiResponse({ status: 200, description: 'Report exported successfully' })
  @ApiQuery({ name: 'format', required: false })
  @ApiQuery({ name: 'type', required: false })
  async exportReport(@Query() query: ExportQueryDto) {
    return this.reportsService.exportReport(query.format || 'csv', query.type);
  }

  @Post('custom')
  @ApiOperation({ summary: 'Generate custom report' })
  @ApiResponse({ status: 201, description: 'Custom report generated successfully' })
  async generateCustomReport(@Body() customReportDto: CustomReportDto) {
    return this.reportsService.generateCustomReport(customReportDto);
  }
}
