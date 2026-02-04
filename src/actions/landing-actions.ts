'use server'

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProjects() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching projects:', error);
        return [];
    }

    return data;
}

export async function createProject(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const image_url = formData.get('image_url') as string;

    const { error } = await supabase
        .from('projects')
        .insert({
            title,
            description,
            category,
            image_url,
        });

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/dashboard/sistema/landing');
    revalidatePath('/');
    return { success: true };
}

export async function updateProject(id: string, prevState: any, formData: FormData) {
    const supabase = await createClient();
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const category = formData.get('category') as string;
    const image_url = formData.get('image_url') as string;
    const is_active = formData.get('is_active') === 'on';

    const { error } = await supabase
        .from('projects')
        .update({
            title,
            description,
            category,
            image_url,
            is_active
        })
        .eq('id', id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/dashboard/sistema/landing');
    revalidatePath('/');
    return { success: true };
}

export async function deleteProject(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/dashboard/sistema/landing');
    revalidatePath('/');
    return { success: true };
}

// --- Contact Requests Actions ---

export async function createContactRequest(prevState: any, formData: FormData) {
    const supabase = await createClient();
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    const message = formData.get('message') as string;

    const { error } = await supabase
        .from('contact_requests')
        .insert({
            name,
            email,
            phone,
            message,
        });

    if (error) {
        return { error: error.message };
    }

    return { success: true, message: 'Solicitud enviada correctamente.' };
}

export async function getContactRequests() {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('contact_requests')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching contact requests:', error);
        return [];
    }

    // Format date for display
    return data.map((item: any) => ({
        ...item,
        date: new Date(item.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }));
}

export async function updateContactRequestStatus(id: string, status: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('contact_requests')
        .update({ status })
        .eq('id', id);

    if (error) {
        return { error: error.message };
    }

    revalidatePath('/dashboard/sistema/landing');
    return { success: true };
}
