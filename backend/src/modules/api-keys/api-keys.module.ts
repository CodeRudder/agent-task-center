import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKeysController } from './controllers/api-keys.controller';
import { ApiKeysService } from './services/api-keys.service';
import { ApiKey } from './entities/api-key.entity';
import { ApiUsageLog } from './entities/api-usage-log.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ApiKey, ApiUsageLog])],
  controllers: [ApiKeysController],
  providers: [ApiKeysService],
  exports: [ApiKeysService],
})
export class ApiKeysModule {}
