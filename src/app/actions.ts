'use server';

import { adaptAnimations } from '@/ai/flows/adaptive-animations';
import { revalidatePath } from 'next/cache';

/**
 * Gets the suggested animation intensity from the GenAI flow.
 * In a real application, serverLoad would come from a monitoring service.
 */
export async function getAnimationIntensity() {
  try {
    const serverLoad = Math.random() * 100;
    const result = await adaptAnimations({ serverLoad });
    return result;
  } catch (error) {
    console.error('Error adapting animations:', error);
    // Fallback to a default intensity in case of an error
    return {
      animationIntensity: 50,
      reasoning: 'Fell back to default due to an error.',
    };
  }
}

/**
 * Placeholder server action for uploading a project.
 * In a real app, this would handle file uploads to a storage service
 * and save project details to the database.
 */
export async function uploadProjectAction(formData: FormData) {
  // This is a placeholder for admin functionality.
  // We'll just log the intent.
  console.log('Attempting to upload a new project...');
  // In a real app, you would process the form data here.
  // const title = formData.get('title');
  // const imageFile = formData.get('image');
  
  // After DB update, revalidate the path to show the new project
  revalidatePath('/');

  return { success: true, message: 'Project upload initiated (placeholder).' };
}

/**
 * Placeholder server action for deleting a project.
 * In a real app, this would delete project data from the database
 * and the associated image from storage.
 */
export async function deleteProjectAction(formData: FormData) {
  const projectId = formData.get('projectId');
  if (!projectId) {
    return { success: false, message: 'Project ID is missing.' };
  }
  
  // This is a placeholder for admin functionality.
  // We'll just log the intent.
  console.log(`Attempting to delete project with ID: ${projectId}...`);

  // After DB update, revalidate the path to update the UI
  revalidatePath('/');
  
  return { success: true, message: `Project ${projectId} deleted (placeholder).` };
}
