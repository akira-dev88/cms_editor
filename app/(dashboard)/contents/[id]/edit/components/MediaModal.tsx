'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mediaApi } from '@/lib/api/media';
import { transformMediaItem } from '@/lib/utils/media';
import { Upload, X, Search, Image as ImageIcon } from 'lucide-react';
import type { MediaItem } from '@/types/media';

interface MediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  selectedMedia: MediaItem[];
  onMediaSelect: (media: MediaItem) => void;
  onSelectedMediaChange: (media: MediaItem[]) => void;
}

export default function MediaModal({
  isOpen,
  onClose,
  contentId,
  selectedMedia,
  onMediaSelect,
  onSelectedMediaChange,
}: MediaModalProps) {
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');

  const loadMediaLibrary = useCallback(async () => {
    try {
      const response = await mediaApi.getAll({ search: searchQuery });
      let mediaArray: any[] = [];

      if (Array.isArray(response)) {
        mediaArray = response;
      } else if (response && Array.isArray(response.data)) {
        mediaArray = response.data;
      }

      const transformedMedia = mediaArray
        .map(item => transformMediaItem(item))
        .filter(Boolean) as MediaItem[];

      setMediaLibrary(transformedMedia);
    } catch (error) {
      console.error('❌ Failed to load media library:', error);
      setMediaLibrary([]);
    }
  }, [searchQuery]);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await mediaApi.upload(file);
      const transformedMedia = transformMediaItem(response.media);
      if (transformedMedia) {
        onSelectedMediaChange([...selectedMedia, transformedMedia]);
        await mediaApi.attachToContent(contentId, transformedMedia.id, 'inline');
        await loadMediaLibrary();
      }
      setUploadFile(null);
    } catch (error) {
      console.error('❌ Failed to upload media:', error);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      loadMediaLibrary();
    }
  }, [isOpen, activeTab, loadMediaLibrary]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Media Library</h2>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                {selectedMedia.length} selected
              </div>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Sidebar */}
          <div className="w-64 border-r p-4">
            <div className="space-y-2">
              <Button
                variant={activeTab === 'library' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('library')}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Media Library
              </Button>
              <Button
                variant={activeTab === 'upload' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('upload')}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload New
              </Button>
            </div>

            {/* Selected Media Preview */}
            {selectedMedia.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium text-sm mb-2">Selected Media</h3>
                <div className="space-y-2">
                  {selectedMedia.map(media => (
                    <div key={media.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <img
                          src={media.thumbnail_url || media.url}
                          alt={media.original_filename}
                          className="w-8 h-8 object-cover rounded"
                        />
                        <span className="text-sm truncate max-w-30">
                          {media.original_filename}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectedMediaChange(
                          selectedMedia.filter(m => m.id !== media.id)
                        )}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1 p-4 overflow-auto">
            {activeTab === 'library' ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search media..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button onClick={loadMediaLibrary}>Refresh</Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {mediaLibrary.map((media) => {
                    const isSelected = selectedMedia.some(m => m.id === media.id);
                    return (
                      <div
                        key={media.id}
                        className={`border rounded-lg overflow-hidden group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                      >
                        <div className="aspect-square bg-gray-100 relative">
                          <img
                            src={media.thumbnail_url || media.url}
                            alt={media.original_filename}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="sm"
                              variant={isSelected ? "destructive" : "default"}
                              onClick={() => onMediaSelect(media)}
                            >
                              {isSelected ? 'Remove' : 'Select'}
                            </Button>
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-sm font-medium truncate">
                            {media.original_filename}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  {/* Upload UI */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}