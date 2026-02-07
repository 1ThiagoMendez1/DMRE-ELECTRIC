"use server";

import { createClient } from "@/utils/supabase/server";
import { Permission, Role, RolePermission } from "@/types/sistema";
import { revalidatePath } from "next/cache";

// --- PERMISSIONS (CATALOG) ---

export async function getPermissionsAction(): Promise<Permission[]> {
    const supabase = await createClient();
    const { data, error } = await supabase.from("permissions").select("*").order("module", { ascending: true });

    if (error) {
        console.error("Error fetching permissions:", error);
        return [];
    }
    return data;
}

// --- ROLES (CATALOG & ASSIGNMENTS) ---

export async function getRolesWithPermissionsAction(): Promise<Role[]> {
    const supabase = await createClient();

    // 1. Get Roles (Unique from profiles for now, OR from a roles table if implemented.
    // Given the previous setup, we are mixing standard roles. 
    // BUT the SQL created a 'roles' table reference in 'role_permissions'. 
    // IF the user created the 'roles' table as implied by "Tabla Actual: roles", we read from it.
    // If not, we might fail. Let's assume 'roles' table exists as per user statement.
    const { data: rolesData, error: rolesError } = await supabase
        .from("roles")
        .select("*")
        .order("name");

    if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        return [];
    }

    // 2. Get Permissions for these roles
    const { data: permsData, error: permsError } = await supabase
        .from("role_permissions")
        .select(`
            *,
            permission:permissions(*)
        `);

    if (permsError) {
        console.error("Error fetching role permissions:", permsError);
        return [];
    }

    // 3. Map
    return rolesData.map((r: any) => {
        const rolePerms = permsData.filter((rp: any) => rp.role_id === r.id);

        return {
            id: r.id,
            name: r.name,
            description: r.description,
            permissions: rolePerms.map((rp: any) => ({
                id: rp.id,
                roleId: rp.role_id,
                roleName: r.name,
                permissionId: rp.permission_id,
                permission: rp.permission,
                canView: rp.can_view,
                canCreate: rp.can_create,
                canEdit: rp.can_edit,
                canDelete: rp.can_delete
            }))
        };
    });
}

export async function createRoleAction(role: Omit<Role, "id" | "permissions">): Promise<Role> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from("roles")
        .insert({ name: role.name, description: role.description })
        .select()
        .single();

    if (error) throw new Error(error.message);

    revalidatePath("/dashboard/sistema/usuarios");
    return { ...data, permissions: [] };
}

export async function updateRolePermissionsAction(roleId: string, permissionId: string, actions: { canView?: boolean; canCreate?: boolean; canEdit?: boolean; canDelete?: boolean }) {
    const supabase = await createClient();

    // Check if entry exists
    const { data: existing } = await supabase
        .from("role_permissions")
        .select("id")
        .eq("role_id", roleId)
        .eq("permission_id", permissionId)
        .single();

    if (existing) {
        // Update
        const updates: any = {};
        if (actions.canView !== undefined) updates.can_view = actions.canView;
        if (actions.canCreate !== undefined) updates.can_create = actions.canCreate;
        if (actions.canEdit !== undefined) updates.can_edit = actions.canEdit;
        if (actions.canDelete !== undefined) updates.can_delete = actions.canDelete;

        const { error } = await supabase.from("role_permissions").update(updates).eq("id", existing.id);
        if (error) throw error;
    } else {
        // Create
        const { error } = await supabase.from("role_permissions").insert({
            role_id: roleId,
            permission_id: permissionId,
            can_view: actions.canView || false,
            can_create: actions.canCreate || false,
            can_edit: actions.canEdit || false,
            can_delete: actions.canDelete || false
        });
        if (error) throw error;
    }

    revalidatePath("/dashboard/sistema/roles");
    return true;
}
