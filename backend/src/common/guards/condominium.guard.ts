import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Role } from '../enums/role.enum';

@Injectable()
export class CondominiumGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SUPER_ADMIN can access all condominiums
    if (user.role === Role.SUPER_ADMIN) {
      return true;
    }

    // Extract condominiumId from route params, query, or body
    const condominiumId =
      request.params?.condominiumId ||
      request.query?.condominiumId ||
      request.body?.condominiumId;

    // If no condominiumId in request, allow (service layer will filter)
    if (!condominiumId) {
      return true;
    }

    // User must belong to the requested condominium
    if (user.condominiumId && user.condominiumId !== condominiumId) {
      throw new ForbiddenException('Access denied: different condominium');
    }

    return true;
  }
}
