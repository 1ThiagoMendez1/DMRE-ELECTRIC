'use server';

import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

// NOTE: This client is SPECIFICALLY for Admin actions using the Service Role.
// It bypasses RLS, so use with extreme caution.
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false,
        },
    }
);

export async function createNewUser(userData: any) {
    const { name, email, password, role, sidebarAccess } = userData;

    try {
        // 1. Create user in Supabase Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto-confirm email since admin is creating it
            user_metadata: {
                full_name: name,
            },
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('No user returned from creation');

        // 2. Create profile in public.profiles
        // Note: The trigger we created might handle this automatically if it listens to insert on auth.users.
        // However, the trigger defaults to 'VIEWER' and ['dashboard']. 
        // We want to set the specific Role and Sidebar Access chosen by the admin.

        // We can update the profile that the trigger created, or insert if the trigger didn't fire yet (race condition).
        // Best approach: Upsert logic.
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .upsert({
                id: authData.user.id,
                full_name: name,
                email: email,
                role: role,
                sidebar_access: sidebarAccess,
                avatar_url: '',
            });

        if (profileError) throw profileError;

        revalidatePath('/dashboard/sistema/usuarios');
        return { success: true, message: 'Usuario creado correctamente.' };

    } catch (error: any) {
        console.error('Error creating user:', error);
        return { error: error.message || 'Error al crear usuario.' };
    }
}

export async function deleteUserAction(userId: string) {
    // Delete from auth (cascades or we delete manually)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };

    // Explicitly delete profile for safety (if cascade missing)
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    revalidatePath('/dashboard/sistema/usuarios');
    return { success: true };
}

export async function getUsers() {
    const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        return [];
    }

    // Fetch valid Auth Users to filter out orphans
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });

    if (authError) {
        console.error("Error fetching auth users:", authError);
        return [];
    }

    const validUserIds = new Set(authUsers.map(u => u.id));
    const validProfiles = profiles.filter(p => validUserIds.has(p.id));

    return validProfiles.map((user: any) => ({
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        sidebarAccess: user.sidebar_access,
        avatar: user.avatar_url,
        isActive: user.is_active ?? true
    }));
}

export async function updateUserPermissionsAction(userId: string, access: string[]) {
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ sidebar_access: access })
        .eq('id', userId);

    if (error) throw error;
    revalidatePath('/dashboard/sistema/usuarios');
    return { success: true };
}

<<<<<<< HEAD
export async function getUserProfile(userId: string) {
    const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !profile) return null;

    return {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        role: profile.role,
        sidebarAccess: profile.sidebar_access,
        avatar: profile.avatar_url
    };
=======
export async function toggleUserStatusAction(userId: string, isActive: boolean) {
    const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

    if (error) {
        console.error("Error toggling user status:", error);
        throw error;
    }

    revalidatePath('/dashboard/sistema/usuarios');
    return { success: true };
>>>>>>> 58f85acb5f4d5d9e776bacbfedc1dae905f83598
}
