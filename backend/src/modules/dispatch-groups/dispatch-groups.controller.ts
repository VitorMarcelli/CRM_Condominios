import { Controller, Get, Post, Body, Param, Query, Delete, UseGuards, Put } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { DispatchGroupsService } from './dispatch-groups.service';
import { RolesGuard } from '../../common/guards';
import { Roles, CurrentUser } from '../../common/decorators';
import { Role } from '../../common/enums';

@ApiTags('Dispatch Groups')
@Controller('dispatch-groups')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class DispatchGroupsController {
  constructor(private service: DispatchGroupsService) {}

  @Get()
  @ApiOperation({ summary: 'List dispatch groups' })
  findAll(@CurrentUser() user: any, @Query('condominiumId') queryCondominiumId?: string) {
    const condominiumId = user.role !== 'super_admin' ? user.condominiumId : queryCondominiumId;
    return this.service.findAll(condominiumId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get dispatch group' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Create dispatch group' })
  create(@Body() dto: { condominiumId: string; name: string; description?: string }, @CurrentUser() user: any) {
    const condominiumId = user.role !== 'super_admin' ? user.condominiumId : dto.condominiumId;
    return this.service.create({ ...dto, condominiumId });
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update dispatch group' })
  update(@Param('id') id: string, @Body() dto: { name?: string; description?: string }) {
    return this.service.update(id, dto);
  }

  @Post(':id/members')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Add member to group' })
  addMember(@Param('id') id: string, @Body() dto: { userId: string; priority?: number }) {
    return this.service.addMember(id, dto.userId, dto.priority);
  }

  @Delete(':id/members/:userId')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Remove member from group' })
  removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    return this.service.removeMember(id, userId);
  }
}
