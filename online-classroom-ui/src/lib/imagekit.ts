import ImageKit from "imagekit";

// Server-side ImageKit instance
export const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.NEXT_PUBLIC_IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

// Configuration cho client-side
export const imagekitConfig = {
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
};

// Helper function để generate signed upload URL
export async function getImageKitAuthenticationParameters() {
  const authenticationParameters = imagekit.getAuthenticationParameters();
  return authenticationParameters;
}

// Helper function để optimize image URL với transformation
export function getOptimizedImageUrl(url: string, options?: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
}) {
  if (!url.includes('ik.imagekit.io')) return url;
  
  const transformations = [];
  
  if (options?.width) transformations.push(`w-${options.width}`);
  if (options?.height) transformations.push(`h-${options.height}`);
  if (options?.quality) transformations.push(`q-${options.quality}`);
  if (options?.format) transformations.push(`f-${options.format}`);
  
  if (transformations.length === 0) return url;
  
  // Insert transformations into ImageKit URL
  const transformationString = transformations.join(',');
  return url.replace('ik.imagekit.io/', `ik.imagekit.io/tr:${transformationString}/`);
}

// Helper function để upload file
export async function uploadToImageKit(file: File, fileName: string, folder: string = "classes") {
  try {
    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const result = await imagekit.upload({
      file: buffer,
      fileName: fileName,
      folder: folder,
      useUniqueFileName: true,
      tags: ["class", "cover"],
    });

    return {
      success: true,
      url: result.url,
      fileId: result.fileId,
      name: result.name,
    };
  } catch (error) {
    console.error("ImageKit upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// Helper function để xóa file
export async function deleteFromImageKit(fileId: string) {
  try {
    await imagekit.deleteFile(fileId);
    return { success: true };
  } catch (error) {
    console.error("ImageKit delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}
