import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { permissionsForRole } from '../constants/role-permissions';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    const effectivePermissions =
      Array.isArray(user.permissions) && user.permissions.length > 0
        ? user.permissions
        : permissionsForRole(user.role);

    // Admin has all permissions
    if (user.role === 'ADMIN' || effectivePermissions.includes('*')) {
      return true;
    }

    return requiredPermissions.every((permission) => effectivePermissions.includes(permission));
  }
}
