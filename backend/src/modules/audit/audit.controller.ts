import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { Role } from '../../common/enums';

@ApiTags('Audit Logs')
@Controller('audit-logs')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class AuditController {
  constructor(private auditService: AuditService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'List audit logs (admin only)' })
  findAll(
    @Query('condominiumId') condominiumId?: string,
    @Query('entityType') entityType?: string,
    @Query('action') action?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.auditService.findAll({ condominiumId, entityType, action, page, limit });
  }
}
