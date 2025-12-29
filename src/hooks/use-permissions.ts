'use client';

import { useAuth } from './use-auth';
import { 
  hasPermission, 
  canAccess, 
  canWrite, 
  canDelete, 
  canManage,
  getAccessibleModules,
  getVisibleSections,
  type Module,
  type Action
} from '@/lib/permissions';

export function usePermissions() {
  const { user } = useAuth();
  const role = user?.role || '';

  return {
    hasPermission: (module: Module, action: Action) => hasPermission(role, module, action),
    canAccess: (module: Module) => canAccess(role, module),
    canWrite: (module: Module) => canWrite(role, module),
    canDelete: (module: Module) => canDelete(role, module),
    canManage: (module: Module) => canManage(role, module),
    getAccessibleModules: () => getAccessibleModules(role),
    getVisibleSections: () => getVisibleSections(role),
    isAdmin: role === 'admin',
    role,
  };
}
