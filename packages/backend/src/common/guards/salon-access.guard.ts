import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RequestUser } from '../interfaces/jwt-payload.interface';
import { AppRole } from '../enums';

/**
 * ABAC guard – ověří, že uživatel má přístup k salonu
 * specifikovanému v :salonId parametru nebo body.salonId.
 * Org owner má přístup ke všem salonům v organizaci.
 */
@Injectable()
export class SalonAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: RequestUser = request.user;
    if (!user) return false;

    // Org owner has access to all salons
    if (user.roles.includes(AppRole.ORG_OWNER)) return true;

    const salonId = request.params.salonId || request.body?.salonId;
    if (!salonId) return true; // No salon context needed

    if (!user.salonIds || !user.salonIds.includes(salonId)) {
      throw new ForbiddenException('Nemáte přístup k tomuto salonu');
    }
    return true;
  }
}
