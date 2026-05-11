import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { PERMISSION_KEY, RequiredPermission } from '../decorators/permission.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SUPER_ADMIN bypasses all checks
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // Check legacy @Roles() decorator first (backward compatibility)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = requiredRoles.some((role) => user.role === role);
      if (!hasRole) {
        throw new ForbiddenException('Insufficient role permissions');
      }
    }

    // Check @RequirePermission() decorator
    const requiredPerm = this.reflector.getAllAndOverride<RequiredPermission>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPerm) {
      return true; // No granular permission required
    }

    // Fetch user's custom role permissions from DB
    const dbUser = await this.prisma.internalUser.findUnique({
      where: { id: user.sub },
      select: {
        role: true,
        customRoleId: true,
        customRole: { select: { permissions: true } },
      },
    });

    if (!dbUser) {
      throw new ForbiddenException('User not found');
    }

    // ADMIN also bypasses granular checks (but not @Roles checks)
    if (dbUser.role === Role.ADMIN) {
      return true;
    }

    // If user has a custom role, check its permissions
    if (dbUser.customRole?.permissions) {
      const perms = dbUser.customRole.permissions as Record<string, Record<string, boolean>>;
      const modulePerms = perms[requiredPerm.module];
      if (!modulePerms || modulePerms[requiredPerm.action] !== true) {
        throw new ForbiddenException(
          `Sem permissão: ${requiredPerm.module}.${requiredPerm.action}`,
        );
      }
      return true;
    }

    // No custom role assigned — allow access (backwards compatible)
    return true;
  }
}
