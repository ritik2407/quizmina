import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Restrict a route to one or more role names (e.g. 'admin', 'teacher'). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
