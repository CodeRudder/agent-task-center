import { Controller, Get, Post, Delete, Body, Param, Query, ParseBoolPipe, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiKeysService } from '../services/api-keys.service';
import { CreateApiKeyDto } from '../dto/create-api-key.dto';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private readonly apiKeysService: ApiKeysService) {}

  @Post()
  @ApiOperation({ summary: 'Create API key' })
  @ApiResponse({ status: 201, description: 'API key created successfully' })
  async create(@Body() createApiKeyDto: CreateApiKeyDto, @Req() req: RequestWithUser) {
    const userId = (req.user as any).id;
    return this.apiKeysService.create(createApiKeyDto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get API keys list' })
  @ApiResponse({ status: 200, description: 'API keys retrieved successfully' })
  async findAll(@Query('isActive', new ParseBoolPipe({ optional: true })) isActive?: boolean) {
    return this.apiKeysService.findAll(isActive);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete API key' })
  @ApiResponse({ status: 204, description: 'API key deleted successfully' })
  async remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    const userId = (req.user as any).id;
    return this.apiKeysService.remove(id, userId);
  }
}