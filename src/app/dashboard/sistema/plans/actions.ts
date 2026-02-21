'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// ============================================
// TYPES
// ============================================

export interface ProyectoPlano {
    id: string;
    name: string;
    description?: string;
    client?: string;
    scale: string;
    canvas_state?: unknown;
    thumbnail_url?: string;
    created_by?: string;
    created_by_name?: string;
    created_at: string;
    updated_at: string;
}

export interface PlanVersion {
    id: string;
    project_id: string;
    name: string;
    description?: string;
    canvas_state: unknown;
    created_by?: string;
    created_at: string;
}

export interface CreateProyectoPlanoInput {
    name: string;
    description?: string;
    client?: string;
    scale?: string;
}

export interface UpdateProyectoPlanoInput {
    id: string;
    name?: string;
    description?: string;
    client?: string;
    scale?: string;
    canvas_state?: unknown;
    thumbnail_url?: string;
}

// ============================================
// GET ALL PROJECTS
// ============================================

export async function getProyectosPlanos(): Promise<{ data: ProyectoPlano[] | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('proyectos_planos')
            .select('*')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching proyectos_planos:', error);
            return { data: null, error: error.message };
        }

        return { data: data as ProyectoPlano[], error: null };
    } catch (err) {
        console.error('Error in getProyectosPlanos:', err);
        return { data: null, error: 'Error fetching projects' };
    }
}

// ============================================
// GET SINGLE PROJECT
// ============================================

export async function getProyectoPlano(id: string): Promise<{ data: ProyectoPlano | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('proyectos_planos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching proyecto_plano:', error);
            return { data: null, error: error.message };
        }

        return { data: data as ProyectoPlano, error: null };
    } catch (err) {
        console.error('Error in getProyectoPlano:', err);
        return { data: null, error: 'Error fetching project' };
    }
}

// ============================================
// CREATE PROJECT
// ============================================

export async function createProyectoPlano(input: CreateProyectoPlanoInput): Promise<{ data: ProyectoPlano | null; error: string | null }> {
    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from('proyectos_planos')
            .insert({
                name: input.name,
                description: input.description || null,
                client: input.client || null,
                scale: input.scale || '1:100',
                created_by: user?.id || null,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating proyecto_plano:', error);
            return { data: null, error: error.message };
        }

        revalidatePath('/dashboard/sistema/plans');
        return { data: data as ProyectoPlano, error: null };
    } catch (err) {
        console.error('Error in createProyectoPlano:', err);
        return { data: null, error: 'Error creating project' };
    }
}

// ============================================
// UPDATE PROJECT
// ============================================

export async function updateProyectoPlano(input: UpdateProyectoPlanoInput): Promise<{ data: ProyectoPlano | null; error: string | null }> {
    try {
        const supabase = await createClient();

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updateData: Record<string, any> = {};

        if (input.name !== undefined) updateData.name = input.name;
        if (input.description !== undefined) updateData.description = input.description;
        if (input.client !== undefined) updateData.client = input.client;
        if (input.scale !== undefined) updateData.scale = input.scale;
        if (input.canvas_state !== undefined) updateData.canvas_state = input.canvas_state;
        if (input.thumbnail_url !== undefined) updateData.thumbnail_url = input.thumbnail_url;

        const { data, error } = await supabase
            .from('proyectos_planos')
            .update(updateData)
            .eq('id', input.id)
            .select()
            .single();

        if (error) {
            console.error('Error updating proyecto_plano:', error);
            return { data: null, error: error.message };
        }

        revalidatePath('/dashboard/sistema/plans');
        return { data: data as ProyectoPlano, error: null };
    } catch (err) {
        console.error('Error in updateProyectoPlano:', err);
        return { data: null, error: 'Error updating project' };
    }
}

// ============================================
// DELETE PROJECT
// ============================================

export async function deleteProyectoPlano(id: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        // First, get the project to check for thumbnail
        const { data: project } = await supabase
            .from('proyectos_planos')
            .select('thumbnail_url')
            .eq('id', id)
            .single();

        // Delete associated files from storage if any
        if (project?.thumbnail_url) {
            const path = project.thumbnail_url.split('/Planos/')[1];
            if (path) {
                await supabase.storage.from('Planos').remove([path]);
            }
        }

        // Delete the project
        const { error } = await supabase
            .from('proyectos_planos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting proyecto_plano:', error);
            return { success: false, error: error.message };
        }

        revalidatePath('/dashboard/sistema/plans');
        return { success: true, error: null };
    } catch (err) {
        console.error('Error in deleteProyectoPlano:', err);
        return { success: false, error: 'Error deleting project' };
    }
}

// ============================================
// SAVE CANVAS STATE
// ============================================

export async function saveCanvasState(projectId: string, canvasState: unknown): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('proyectos_planos')
            .update({ canvas_state: canvasState })
            .eq('id', projectId);

        if (error) {
            console.error('Error saving canvas state:', error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err) {
        console.error('Error in saveCanvasState:', err);
        return { success: false, error: 'Error saving canvas' };
    }
}

// ============================================
// UPLOAD THUMBNAIL
// ============================================

export async function uploadThumbnail(projectId: string, file: File): Promise<{ url: string | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const fileExt = file.name.split('.').pop();
        const fileName = `${projectId}/thumbnail.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('Planos')
            .upload(fileName, file, { upsert: true });

        if (uploadError) {
            console.error('Error uploading thumbnail:', uploadError);
            return { url: null, error: uploadError.message };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('Planos')
            .getPublicUrl(fileName);

        // Update project with thumbnail URL
        await supabase
            .from('proyectos_planos')
            .update({ thumbnail_url: urlData.publicUrl })
            .eq('id', projectId);

        return { url: urlData.publicUrl, error: null };
    } catch (err) {
        console.error('Error in uploadThumbnail:', err);
        return { url: null, error: 'Error uploading thumbnail' };
    }
}

// ============================================
// EXPORT PLAN TO STORAGE
// ============================================

export async function exportPlanToStorage(
    projectId: string,
    fileData: string,
    format: 'png' | 'pdf' | 'svg'
): Promise<{ url: string | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const fileName = `${projectId}/export_${Date.now()}.${format}`;

        // Convert base64 to blob
        const base64Data = fileData.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);

        const mimeType = format === 'pdf' ? 'application/pdf' :
            format === 'svg' ? 'image/svg+xml' : 'image/png';
        const blob = new Blob([byteArray], { type: mimeType });

        // Upload to storage
        const { error: uploadError } = await supabase.storage
            .from('Planos')
            .upload(fileName, blob, { upsert: true });

        if (uploadError) {
            console.error('Error uploading export:', uploadError);
            return { url: null, error: uploadError.message };
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('Planos')
            .getPublicUrl(fileName);

        return { url: urlData.publicUrl, error: null };
    } catch (err) {
        console.error('Error in exportPlanToStorage:', err);
        return { url: null, error: 'Error exporting plan' };
    }
}
// ============================================
// VERSIONING ACTIONS
// ============================================

export async function createPlanVersion(projectId: string, name: string, description?: string, canvasState?: unknown): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        let snapshotState = canvasState;

        // 1. If no state provided, fetch current project state
        if (!snapshotState) {
            const { data: project } = await supabase
                .from('proyectos_planos')
                .select('canvas_state')
                .eq('id', projectId)
                .single();

            if (!project) return { success: false, error: 'Proyecto no encontrado' };
            snapshotState = project.canvas_state;
        }

        // 2. Create version snapshot
        const { error } = await supabase
            .from('plan_versions')
            .insert({
                project_id: projectId,
                name,
                description,
                canvas_state: snapshotState
            });

        if (error) {
            console.error('Error creating plan version:', error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err) {
        console.error('Error in createPlanVersion:', err);
        return { success: false, error: 'Error creating version' };
    }
}

export async function getPlanVersions(projectId: string): Promise<{ data: PlanVersion[] | null; error: string | null }> {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('plan_versions')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching plan versions:', error);
            return { data: null, error: error.message };
        }

        return { data: data as PlanVersion[], error: null };
    } catch (err) {
        console.error('Error in getPlanVersions:', err);
        return { data: null, error: 'Error fetching versions' };
    }
}

export async function restorePlanVersion(versionId: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        // 1. Get version state
        const { data: version } = await supabase
            .from('plan_versions')
            .select('*')
            .eq('id', versionId)
            .single();

        if (!version) return { success: false, error: 'Versión no encontrada' };

        // 2. Update project with version state
        const { error } = await supabase
            .from('proyectos_planos')
            .update({ canvas_state: version.canvas_state })
            .eq('id', version.project_id);

        if (error) {
            console.error('Error restoring version:', error);
            return { success: false, error: error.message };
        }

        revalidatePath(`/dashboard/sistema/plans/canvas/${version.project_id}`);
        return { success: true, error: null };
    } catch (err) {
        console.error('Error in restorePlanVersion:', err);
        return { success: false, error: 'Error restoring version' };
    }
}

export async function deletePlanVersion(versionId: string): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient();

        const { error } = await supabase
            .from('plan_versions')
            .delete()
            .eq('id', versionId);

        if (error) {
            console.error('Error deleting version:', error);
            return { success: false, error: error.message };
        }

        return { success: true, error: null };
    } catch (err) {
        console.error('Error in deletePlanVersion:', err);
        return { success: false, error: 'Error deleting version' };
    }
}
