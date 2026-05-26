import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { tenantContext } from '../context/tenant-context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    let organizationId: string | null | undefined;
    let condominiumId: string | null | undefined;

    // 1. JWT fallback if AuthGuard hasn't set it (middleware runs first)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = this.jwtService.decode(token) as any;
        if (decoded) {
          organizationId = decoded.organizationId;
          condominiumId = decoded.condominiumId;
        }
      } catch (e) {
        // Ignored. AuthGuard will reject invalid tokens later.
      }
    }

    // 2. Custom header (e.g. sent by frontend based on subdomain)
    if (!organizationId && req.headers['x-organization-id']) {
      organizationId = req.headers['x-organization-id'] as string;
    }

    // Run the rest of the request within this context
    tenantContext.run({ organizationId, condominiumId }, () => {
      next();
    });
  }
}
