import { supabase } from './supabase';

const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

export async function uploadImage(
  file: File,
  bucket: 'avatars' | 'project-images' | 'announcements',
  userId?: string
): Promise<string | null> {
  try {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      console.error('Invalid file type:', file.type);
      throw new Error('Only image files are allowed (jpg, png, gif, webp, svg)');
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !ALLOWED_IMAGE_EXTENSIONS.includes(fileExt)) {
      console.error('Invalid file extension:', fileExt);
      throw new Error('Only image files are allowed (jpg, png, gif, webp, svg)');
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    const fileName = userId ? `${userId}/${Date.now()}.${fileExt}` : `${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    return data.publicUrl;
  } catch (error: any) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export async function deleteImage(url: string, bucket: 'avatars' | 'project-images'): Promise<boolean> {
  try {
    const fileName = url.split('/').slice(-2).join('/');

    const { error } = await supabase.storage
      .from(bucket)
      .remove([fileName]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}
