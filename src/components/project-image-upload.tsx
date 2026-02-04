'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, X } from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/hooks/use-toast";

interface ProjectImageUploadProps {
    currentImageUrl?: string;
    onImageUploaded: (url: string) => void;
}

export function ProjectImageUpload({ currentImageUrl, onImageUploaded }: ProjectImageUploadProps) {
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const supabase = createClient();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('projects')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('projects')
                .getPublicUrl(filePath);

            setPreviewUrl(data.publicUrl);
            onImageUploaded(data.publicUrl);
        } catch (error: any) {
            console.error('Error uploading image:', error);
            toast({
                title: "Error al subir imagen",
                description: error.message || "Ocurrió un error inesperado al subir la imagen.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const clearImage = () => {
        setPreviewUrl(null);
        onImageUploaded('');
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-4">
                {previewUrl ? (
                    <div className="relative w-full h-48 rounded-md overflow-hidden border">
                        <Image
                            src={previewUrl}
                            alt="Project preview"
                            fill
                            className="object-cover"
                        />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8"
                            onClick={clearImage}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-md border-muted-foreground/25 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground">
                                <span className="font-semibold">Click para subir</span> o arrastra y suelta
                            </p>
                            <p className="text-xs text-muted-foreground">PNG, JPG or WEBP</p>
                        </div>
                        <input
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </label>
                )}
            </div>
            {isUploading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Subiendo imagen...
                </div>
            )}
        </div>
    );
}
