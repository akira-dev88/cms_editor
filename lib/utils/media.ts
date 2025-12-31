// lib/utils/media.ts
export function buildMediaUrl(filePath: any): string {
  console.log('🔗 buildMediaUrl called with:', filePath);
  
  if (!filePath) {
    console.warn('⚠️ buildMediaUrl: No filePath provided');
    return '';
  }
  
  // Convert to string
  const pathStr = String(filePath).trim();
  if (!pathStr || pathStr === 'undefined' || pathStr === 'null') {
    console.warn('⚠️ buildMediaUrl: Invalid filePath string:', pathStr);
    return '';
  }
  
  // Ensure path starts with /
  const normalizedPath = pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
  
  // Get base URL - IMPORTANT: Check if this is correct!
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  console.log('🌐 Base URL:', baseUrl);
  
  const fullUrl = `${baseUrl}${normalizedPath}`;
  console.log('🔗 Built URL:', fullUrl);
  
  return fullUrl;
}

export function transformMediaItem(apiItem: any): any {
  console.log('🔄 transformMediaItem called with:', apiItem);
  
  if (!apiItem) {
    console.error('❌ transformMediaItem: No API item provided');
    return null;
  }
  
  // Extract file_path - check different possible property names
  const filePath = apiItem.file_path || apiItem.path || apiItem.url || '';
  console.log('📁 Extracted filePath:', filePath);
  
  if (!filePath) {
    console.error('❌ No file path found in API item:', apiItem);
    console.log('Available keys:', Object.keys(apiItem));
  }
  
  // Build URLs
  const imageUrl = buildMediaUrl(filePath);
  
  // Get thumbnail path
  let thumbnailPath = '';
  if (apiItem.thumbnail_paths && apiItem.thumbnail_paths.small) {
    thumbnailPath = apiItem.thumbnail_paths.small;
  } else if (apiItem.thumbnail_url) {
    thumbnailPath = apiItem.thumbnail_url;
  }
  
  const thumbnailUrl = thumbnailPath ? buildMediaUrl(thumbnailPath) : imageUrl;
  
  console.log('✅ Built URLs:', { imageUrl, thumbnailUrl });
  
  return {
    id: apiItem.id || '',
    filename: apiItem.filename || apiItem.original_filename || 'image',
    original_filename: apiItem.original_filename || apiItem.filename || 'image',
    file_path: filePath,
    mime_type: apiItem.mime_type || 'image/jpeg',
    file_size: parseInt(apiItem.file_size) || 0,
    url: imageUrl,  // <-- THIS MUST NOT BE UNDEFINED
    thumbnail_url: thumbnailUrl,
    thumbnail_paths: apiItem.thumbnail_paths || {},
    dimensions: {
      width: apiItem.width || undefined,
      height: apiItem.height || undefined
    },
    created_at: apiItem.created_at || new Date().toISOString(),
    updated_at: apiItem.updated_at || apiItem.created_at || new Date().toISOString()
  };
}