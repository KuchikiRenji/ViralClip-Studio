import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

type BucketName = 'uploads' | 'media' | 'exports' | 'thumbnails';

interface UploadOptions {
  bucket: BucketName;
  path?: string;
  contentType?: string;
  onProgress?: (progress: number) => void;
}

interface StorageFile {
  id: string;
  bucket: string;
  path: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
}

export function useStorage() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const upload = useCallback(async (
    file: File,
    options: UploadOptions
  ): Promise<StorageFile | null> => {
    if (!user) {
      setError(new Error('Not authenticated'));
      return null;
    }

    setUploading(true);
    setError(null);

    const fileExt = file.name.split('.').pop();
    const fileName = `${crypto.randomUUID()}.${fileExt}`;
    const filePath = options.path 
      ? `${user.id}/${options.path}/${fileName}`
      : `${user.id}/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from(options.bucket)
        .upload(filePath, file, {
          contentType: options.contentType || file.type,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const mediaType = file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio'
        : file.type.startsWith('image/') ? 'image'
        : 'document';

      const { data: mediaFile, error: dbError } = await supabase
        .from('media_files')
        .insert({
          user_id: user.id,
          bucket: options.bucket,
          path: filePath,
          filename: fileName,
          original_filename: file.name,
          mime_type: file.type,
          media_type: mediaType,
          size_bytes: file.size,
          is_processed: false,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      return mediaFile as StorageFile;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Upload failed'));
      return null;
    } finally {
      setUploading(false);
    }
  }, [user]);

  const getSignedUrl = useCallback(async (
    bucket: BucketName,
    path: string,
    expiresIn = 3600
  ): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    return error ? null : data.signedUrl;
  }, []);

  const getPublicUrl = useCallback((bucket: BucketName, path: string): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }, []);

  const deleteFile = useCallback(async (
    bucket: BucketName,
    path: string,
    fileId?: string
  ): Promise<boolean> => {
    const { error: storageError } = await supabase.storage
      .from(bucket)
      .remove([path]);

    if (storageError) return false;

    if (fileId) {
      await supabase
        .from('media_files')
        .delete()
        .eq('id', fileId);
    }

    return true;
  }, []);

  const listFiles = useCallback(async (
    bucket: BucketName,
    folder?: string
  ): Promise<StorageFile[]> => {
    if (!user) return [];

    const path = folder ? `${user.id}/${folder}` : user.id;

    const { data, error } = await supabase
      .from('media_files')
      .select('*')
      .eq('user_id', user.id)
      .eq('bucket', bucket)
      .like('path', `${path}%`)
      .order('created_at', { ascending: false });

    return error ? [] : (data as StorageFile[]);
  }, [user]);

  return {
    upload,
    getSignedUrl,
    getPublicUrl,
    deleteFile,
    listFiles,
    uploading,
    error,
  };
}
