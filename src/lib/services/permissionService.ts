import { prisma } from '@/lib/db/prisma'

// Default system permissions
export const SYSTEM_PERMISSIONS = [
  // User management
  { name: 'users.create', resource: 'users', action: 'create', description: 'Create new users' },
  { name: 'users.read', resource: 'users', action: 'read', description: 'View user profiles' },
  { name: 'users.update', resource: 'users', action: 'update', description: 'Update user profiles' },
  { name: 'users.delete', resource: 'users', action: 'delete', description: 'Delete users' },
  { name: 'users.block', resource: 'users', action: 'block', description: 'Block/unblock users' },

  // Group management
  { name: 'groups.create', resource: 'groups', action: 'create', description: 'Create groups' },
  { name: 'groups.read', resource: 'groups', action: 'read', description: 'View groups' },
  { name: 'groups.update', resource: 'groups', action: 'update', description: 'Update groups' },
  { name: 'groups.delete', resource: 'groups', action: 'delete', description: 'Delete groups' },
  { name: 'groups.manage_members', resource: 'groups', action: 'manage_members', description: 'Manage group members' },

  // Activity management
  { name: 'activities.create', resource: 'activities', action: 'create', description: 'Create activities' },
  { name: 'activities.read', resource: 'activities', action: 'read', description: 'View activities' },
  { name: 'activities.update', resource: 'activities', action: 'update', description: 'Update activities' },
  { name: 'activities.delete', resource: 'activities', action: 'delete', description: 'Delete activities' },
  { name: 'activities.manage_exam', resource: 'activities', action: 'manage_exam', description: 'Manage exam settings' },

  // Questions
  { name: 'questions.create', resource: 'questions', action: 'create', description: 'Create questions' },
  { name: 'questions.read', resource: 'questions', action: 'read', description: 'View questions' },
  { name: 'questions.update', resource: 'questions', action: 'update', description: 'Update questions' },
  { name: 'questions.delete', resource: 'questions', action: 'delete', description: 'Delete questions' },
  { name: 'questions.evaluate', resource: 'questions', action: 'evaluate', description: 'Trigger AI evaluation' },

  // Responses
  { name: 'responses.create', resource: 'responses', action: 'create', description: 'Create responses' },
  { name: 'responses.read', resource: 'responses', action: 'read', description: 'View responses' },
  { name: 'responses.delete', resource: 'responses', action: 'delete', description: 'Delete responses' },

  // Certificates
  { name: 'certificates.create', resource: 'certificates', action: 'create', description: 'Create certificates' },
  { name: 'certificates.approve', resource: 'certificates', action: 'approve', description: 'Approve certificates' },
  { name: 'certificates.issue', resource: 'certificates', action: 'issue', description: 'Issue certificates' },

  // Analytics
  { name: 'analytics.view', resource: 'analytics', action: 'view', description: 'View analytics' },
  { name: 'analytics.export', resource: 'analytics', action: 'export', description: 'Export analytics data' },

  // Admin
  { name: 'admin.access', resource: 'admin', action: 'access', description: 'Access admin panel' },
  { name: 'admin.settings', resource: 'admin', action: 'settings', description: 'Manage system settings' },
  { name: 'admin.roles', resource: 'admin', action: 'roles', description: 'Manage roles and permissions' },

  // Subscriptions
  { name: 'subscriptions.view', resource: 'subscriptions', action: 'view', description: 'View subscription plans' },
  { name: 'subscriptions.manage', resource: 'subscriptions', action: 'manage', description: 'Manage subscriptions' },
] as const

// Default system roles
export const SYSTEM_ROLES = [
  {
    name: 'super_admin',
    description: 'Full system access',
    priority: 100,
    permissions: SYSTEM_PERMISSIONS.map(p => p.name),
  },
  {
    name: 'admin',
    description: 'Administrative access',
    priority: 90,
    permissions: SYSTEM_PERMISSIONS
      .filter(p => !['admin.settings', 'admin.roles'].includes(p.name))
      .map(p => p.name),
  },
  {
    name: 'teacher',
    description: 'Teacher role with group and activity management',
    priority: 50,
    permissions: [
      'users.read',
      'groups.create', 'groups.read', 'groups.update', 'groups.delete', 'groups.manage_members',
      'activities.create', 'activities.read', 'activities.update', 'activities.delete', 'activities.manage_exam',
      'questions.create', 'questions.read', 'questions.update', 'questions.delete', 'questions.evaluate',
      'responses.create', 'responses.read', 'responses.delete',
      'certificates.create', 'certificates.issue',
      'analytics.view', 'analytics.export',
      'subscriptions.view',
    ],
  },
  {
    name: 'student',
    description: 'Student role with basic access',
    priority: 10,
    permissions: [
      'groups.read',
      'activities.read',
      'questions.create', 'questions.read', 'questions.update',
      'responses.create', 'responses.read',
      'analytics.view',
    ],
  },
] as const

/**
 * Initialize system permissions and roles
 */
export async function initializePermissions() {
  try {
    // Create system permissions
    for (const perm of SYSTEM_PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: perm.name },
        update: {
          description: perm.description,
          resource: perm.resource,
          action: perm.action,
          isSystem: true,
        },
        create: {
          name: perm.name,
          description: perm.description,
          resource: perm.resource,
          action: perm.action,
          isSystem: true,
        },
      })
    }

    // Create system roles with their permissions
    for (const roleConfig of SYSTEM_ROLES) {
      const role = await prisma.role.upsert({
        where: { name: roleConfig.name },
        update: {
          description: roleConfig.description,
          priority: roleConfig.priority,
          isSystem: true,
        },
        create: {
          name: roleConfig.name,
          description: roleConfig.description,
          priority: roleConfig.priority,
          isSystem: true,
        },
      })

      // Get permission IDs
      const permissions = await prisma.permission.findMany({
        where: { name: { in: roleConfig.permissions as unknown as string[] } },
      })

      // Assign permissions to role
      for (const perm of permissions) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: { roleId: role.id, permissionId: perm.id },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: perm.id,
          },
        })
      }
    }

    return { success: true }
  } catch (error) {
    console.error('[PermissionService] Failed to initialize permissions:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get all permissions
 */
export async function getAllPermissions() {
  try {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    })

    // Group by resource
    const grouped = permissions.reduce((acc, perm) => {
      const resource = perm.resource || 'other'
      if (!acc[resource]) acc[resource] = []
      acc[resource].push(perm)
      return acc
    }, {} as Record<string, typeof permissions>)

    return { permissions, grouped }
  } catch (error) {
    console.error('[PermissionService] Failed to get permissions:', error)
    return { permissions: [], grouped: {} }
  }
}

/**
 * Get permissions for a user (based on their role)
 */
export async function getUserPermissions(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    })

    if (!user?.role) {
      // Default to student permissions if no role assigned
      const studentRole = await prisma.role.findUnique({
        where: { name: 'student' },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      })

      return {
        role: studentRole?.name || 'student',
        permissions: studentRole?.permissions.map(rp => rp.permission.name) || [],
      }
    }

    return {
      role: user.role.name,
      permissions: user.role.permissions.map(rp => rp.permission.name),
    }
  } catch (error) {
    console.error('[PermissionService] Failed to get user permissions:', error)
    return { role: 'student', permissions: [] }
  }
}

/**
 * Get permissions for a role
 */
export async function getRolePermissions(roleId: string) {
  try {
    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    })

    return rolePermissions.map(rp => ({
      id: rp.permission.id,
      name: rp.permission.name,
      description: rp.permission.description,
      resource: rp.permission.resource,
      action: rp.permission.action,
    }))
  } catch (error) {
    console.error('[PermissionService] Failed to get role permissions:', error)
    return []
  }
}

/**
 * Assign permission to a role
 */
export async function assignPermissionToRole(roleId: string, permissionId: string) {
  try {
    await prisma.rolePermission.create({
      data: { roleId, permissionId },
    })
    return { success: true }
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return { error: 'Permission already assigned to this role' }
    }
    console.error('[PermissionService] Failed to assign permission:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Revoke permission from a role
 */
export async function revokePermissionFromRole(roleId: string, permissionId: string) {
  try {
    await prisma.rolePermission.delete({
      where: {
        roleId_permissionId: { roleId, permissionId },
      },
    })
    return { success: true }
  } catch (error) {
    console.error('[PermissionService] Failed to revoke permission:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Check if a user has a specific permission
 */
export async function checkPermission(userId: string, permissionName: string): Promise<boolean> {
  try {
    const { permissions } = await getUserPermissions(userId)
    return permissions.includes(permissionName)
  } catch (error) {
    console.error('[PermissionService] Failed to check permission:', error)
    return false
  }
}

/**
 * Check multiple permissions at once
 */
export async function checkPermissions(userId: string, permissionNames: string[]): Promise<Record<string, boolean>> {
  try {
    const { permissions } = await getUserPermissions(userId)
    return permissionNames.reduce((acc, name) => {
      acc[name] = permissions.includes(name)
      return acc
    }, {} as Record<string, boolean>)
  } catch (error) {
    console.error('[PermissionService] Failed to check permissions:', error)
    return permissionNames.reduce((acc, name) => {
      acc[name] = false
      return acc
    }, {} as Record<string, boolean>)
  }
}

/**
 * Create a new permission
 */
export async function createPermission(data: {
  name: string
  description?: string
  resource?: string
  action?: string
}) {
  try {
    const permission = await prisma.permission.create({
      data: {
        name: data.name,
        description: data.description,
        resource: data.resource,
        action: data.action,
        isSystem: false,
      },
    })
    return { success: true, permission }
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return { error: 'Permission with this name already exists' }
    }
    console.error('[PermissionService] Failed to create permission:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update a permission
 */
export async function updatePermission(
  permissionId: string,
  data: { name?: string; description?: string; resource?: string; action?: string }
) {
  try {
    // Check if it's a system permission
    const existing = await prisma.permission.findUnique({
      where: { id: permissionId },
    })

    if (existing?.isSystem) {
      return { error: 'Cannot modify system permissions' }
    }

    const permission = await prisma.permission.update({
      where: { id: permissionId },
      data,
    })
    return { success: true, permission }
  } catch (error) {
    console.error('[PermissionService] Failed to update permission:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Delete a permission
 */
export async function deletePermission(permissionId: string) {
  try {
    // Check if it's a system permission
    const existing = await prisma.permission.findUnique({
      where: { id: permissionId },
    })

    if (existing?.isSystem) {
      return { error: 'Cannot delete system permissions' }
    }

    // Delete associated role permissions first
    await prisma.rolePermission.deleteMany({
      where: { permissionId },
    })

    await prisma.permission.delete({
      where: { id: permissionId },
    })
    return { success: true }
  } catch (error) {
    console.error('[PermissionService] Failed to delete permission:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Get all roles
 */
export async function getAllRoles() {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { priority: 'desc' },
      include: {
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
    })

    return roles.map(role => ({
      id: role.id,
      name: role.name,
      description: role.description,
      priority: role.priority,
      isSystem: role.isSystem,
      userCount: role._count.users,
      permissionCount: role._count.permissions,
    }))
  } catch (error) {
    console.error('[PermissionService] Failed to get roles:', error)
    return []
  }
}

/**
 * Create a new role
 */
export async function createRole(data: {
  name: string
  description?: string
  priority?: number
  permissionIds?: string[]
}) {
  try {
    const role = await prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        priority: data.priority || 0,
        isSystem: false,
      },
    })

    // Assign permissions if provided
    if (data.permissionIds && data.permissionIds.length > 0) {
      await prisma.rolePermission.createMany({
        data: data.permissionIds.map(permissionId => ({
          roleId: role.id,
          permissionId,
        })),
        skipDuplicates: true,
      })
    }

    return { success: true, role }
  } catch (error) {
    if ((error as { code?: string }).code === 'P2002') {
      return { error: 'Role with this name already exists' }
    }
    console.error('[PermissionService] Failed to create role:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Update a role
 */
export async function updateRole(
  roleId: string,
  data: { name?: string; description?: string; priority?: number }
) {
  try {
    const existing = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (existing?.isSystem && data.name && data.name !== existing.name) {
      return { error: 'Cannot rename system roles' }
    }

    const role = await prisma.role.update({
      where: { id: roleId },
      data,
    })
    return { success: true, role }
  } catch (error) {
    console.error('[PermissionService] Failed to update role:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Delete a role
 */
export async function deleteRole(roleId: string) {
  try {
    const existing = await prisma.role.findUnique({
      where: { id: roleId },
    })

    if (existing?.isSystem) {
      return { error: 'Cannot delete system roles' }
    }

    // Delete associated role permissions
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    })

    // Remove role from users (set to null)
    await prisma.user.updateMany({
      where: { roleUuid: roleId },
      data: { roleUuid: null },
    })

    await prisma.role.delete({
      where: { id: roleId },
    })
    return { success: true }
  } catch (error) {
    console.error('[PermissionService] Failed to delete role:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Assign a role to a user
 */
export async function assignRoleToUser(userId: string, roleId: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { roleUuid: roleId },
    })
    return { success: true }
  } catch (error) {
    console.error('[PermissionService] Failed to assign role to user:', error)
    return { error: error instanceof Error ? error.message : 'Unknown error' }
  }
}
