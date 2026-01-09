// components/editor/MediaModal.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon, Upload, X, Search, Loader2 } from 'lucide-react';
import { mediaApi, MediaItem } from '@/lib/api/media';
import { useToast } from '@/lib/hooks/use-toast';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaItem) => void;
}

export default function MediaModal({ isOpen, onClose, onSelect }: MediaModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('upload');
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]); // Initialize as empty array
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load media library
  const loadMediaLibrary = useCallback(async () => {
    setLoading(true);
    try {
      const response = await mediaApi.getAll({ search: searchQuery });
      setMediaItems(response.data || []); // Ensure it's always an array
    } catch (error) {
      console.error('Failed to load media library:', error);
      toast({
        title: 'Error',
        description: 'Failed to load media library',
      });
      setMediaItems([]); // Set to empty array on error
    } finally {
      setLoading(false);
    }
  }, [searchQuery, toast]);

  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      loadMediaLibrary();
    } else if (activeTab === 'upload') {
      // Reset media items when switching to upload tab
      setMediaItems([]);
    }
  }, [isOpen, activeTab, loadMediaLibrary]);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file (JPEG, PNG, GIF, WebP, SVG)',
        });
        return;
      }

      // Validate file size (10MB max)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Maximum file size is 10MB',
        });
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a file to upload',
      });
      return;
    }

    setUploading(true);
    try {
      const response = await mediaApi.upload(file);
      toast({
        title: 'Success',
        description: 'Image uploaded successfully',
      });

      // Add to library and select it
      setMediaItems(prev => [response.media, ...(prev || [])]);
      onSelect(response.media);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload image',
      });
    } finally {
      setUploading(false);
      setFile(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col" aria-describedby="media-modal-description">
        <div id="media-dialog-description" className="sr-only">
          Media library for uploading and selecting images
        </div>

        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
          <DialogDescription className="sr-only">
            Browse and select images from your media library or upload new images
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">Upload New</TabsTrigger>
            <TabsTrigger value="library">Media Library</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="flex-1 overflow-auto">
            <Card>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <Upload className="h-12 w-12 text-gray-400" />
                      <div className="space-y-2">
                        <h3 className="font-semibold">Upload an image</h3>
                        <p className="text-sm text-gray-500">
                          Drag and drop or click to browse
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="cursor-pointer"
                        />
                        <p className="text-xs text-gray-500">
                          Supported formats: JPEG, PNG, GIF, WebP, SVG. Max size: 10MB
                        </p>
                      </div>
                    </div>

                    {file && (
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <ImageIcon className="h-8 w-8 text-blue-500" />
                            <div>
                              <p className="font-medium">{file.name}</p>
                              <p className="text-sm text-gray-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setFile(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={!file || uploading}
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        'Upload Image'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="library" className="flex-1 flex flex-col">
            <Card className="flex-1 flex flex-col">
              <CardContent className="p-4 flex-1 flex flex-col">
                {/* Search Bar */}
                <div className="mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search media..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Media Grid - FIXED with null check */}
                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : !mediaItems || mediaItems.length === 0 ? ( // Add null check here
                  <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                    <ImageIcon className="h-12 w-12 mb-4" />
                    <p>No media found</p>
                    <p className="text-sm">Upload some images to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto flex-1">
                    {mediaItems.map((media) => (
                      <div
                        key={media.id}
                        className="group relative border rounded-lg overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          console.log('Selecting media:', {
                            id: media.id,
                            url: media.url,
                            thumbnail: media.thumbnail_url
                          });
                          onSelect(media);
                          onClose();
                        }}
                      >
                        <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                          {/* Loading state */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
                          </div>

                          {/* Image with error handling */}
                          <img
                            src={media.thumbnail_url || media.url}
                            alt={media.original_filename || 'Media'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 relative z-10"
                            onLoad={(e) => {
                              console.log('Image loaded successfully:', media.url);
                              // Hide loader when image loads
                              e.currentTarget.style.opacity = '1';
                            }}
                            onError={(e) => {
                              console.error('Image failed to load:', {
                                url: media.url,
                                thumbnail: media.thumbnail_url,
                                mediaId: media.id
                              });

                              // Show error placeholder
                              const parent = e.currentTarget.parentElement;
                              if (parent) {
                                parent.innerHTML = `
              <div class="w-full h-full flex flex-col items-center justify-center bg-gray-200">
                <ImageIcon class="h-12 w-12 text-gray-400 mb-2" />
                <span class="text-xs text-gray-600">Failed to load</span>
              </div>
            `;
                              }
                            }}
                            style={{ opacity: 0 }}
                          />
                        </div>
                        <div className="p-2 bg-white">
                          <p className="text-sm font-medium truncate" title={media.original_filename}>
                            {media.original_filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {media.dimensions?.width && media.dimensions?.height
                              ? `${media.dimensions.width} × ${media.dimensions.height}`
                              : 'Size unknown'}
                          </p>
                          <p className="text-xs text-gray-400 truncate" title={media.url}>
                            {media.url ? media.url.substring(0, 30) + '...' : 'No URL'}
                          </p>
                        </div>
                      </div>
                    ))}

                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}