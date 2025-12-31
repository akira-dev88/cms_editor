// app/(dashboard)/contents/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { contentApi } from '@/lib/api/content';
import { mediaApi } from '@/lib/api/media'; // Add media API import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, Image as ImageIcon, Upload, X, Search } from 'lucide-react';
import { ContentStatus } from '@/types/content';
import { useToast } from '@/lib/hooks/use-toast';
import LexicalEditor from '@/components/editor/lexical-editor';
import { transformMediaItem } from '@/lib/utils/media';

interface MediaItem {
  id: string;
  filename: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  url: string;
  thumbnail_url?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  created_at: string;
}

export default function CreateContentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState('');

  // Media states
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]); // Store media to attach after creation
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMediaTab, setActiveMediaTab] = useState<'library' | 'upload'>('library');

  // Form state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [contentType, setContentType] = useState('');
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT);
  const [metaData, setMetaData] = useState('{}');

  const [editorContent, setEditorContent] = useState('');
  const [lexicalState, setLexicalState] = useState<any>(null);
  const [plainText, setPlainText] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    loadContentTypes();
  }, []);

  useEffect(() => {
    if (showMediaModal && activeMediaTab === 'library') {
      loadMediaLibrary();
    }
  }, [showMediaModal, activeMediaTab, searchQuery]);

  useEffect(() => {
    // Generate slug from title
    if (title && !slug) {
      const generatedSlug = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
      setSlug(generatedSlug);
    }
  }, [title, slug]);

  const loadContentTypes = async () => {
    try {
      const types = await contentApi.getContentTypes();
      setContentTypes(types);
      if (types.length > 0) {
        setContentType(types[0].slug);
      }
    } catch (error) {
      console.error('Failed to load content types:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content types',
      });
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadMediaLibrary = async () => {
    try {
      console.log('🔍 Loading media library...');
      const response = await mediaApi.getAll({ search: searchQuery });

      console.log('📦 Raw API response:', response);

      // Ensure we have an array
      let mediaArray: any[] = [];

      if (Array.isArray(response)) {
        mediaArray = response;
        console.log('📊 Using response as array, length:', mediaArray.length);
      } else if (response && Array.isArray(response.data)) {
        mediaArray = response.data;
        console.log('📊 Using response.data as array, length:', mediaArray.length);
      }

      if (mediaArray.length === 0) {
        console.warn('⚠️ No media items found');
        setMediaLibrary([]);
        return;
      }

      console.log('🔄 Transforming media items...');
      console.log('First raw item:', mediaArray[0]);

      // Transform EACH item
      const transformedMedia = mediaArray.map(item => {
        console.log('Transforming item:', {
          id: item.id,
          file_path: item.file_path,
          keys: Object.keys(item)
        });

        const transformed = transformMediaItem(item);
        console.log('Transformed result:', transformed);
        return transformed;
      });

      console.log('✅ Transformed media library:', transformedMedia);
      console.log('First transformed item URL:', transformedMedia[0]?.url);

      setMediaLibrary(transformedMedia);

    } catch (error) {
      console.error('❌ Failed to load media library:', error);
      toast({
        title: 'Error',
        description: 'Failed to load media library',
      });
      setMediaLibrary([]);
    }
  };
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await mediaApi.upload(file);
      toast({
        title: 'Success',
        description: 'Media uploaded successfully',
      });
      // Add to selected media for later attachment
      setSelectedMedia(prev => [...prev, response.media]);
      // Refresh library
      await loadMediaLibrary();
      setUploadFile(null);
    } catch (error) {
      console.error('Failed to upload media:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload media',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaSelect = (media: MediaItem) => {
    // Add to selected media for later attachment
    setSelectedMedia(prev => [...prev, media]);
    toast({
      title: 'Media selected',
      description: 'Media will be attached after content is created',
    });
  };

  const handleRemoveSelectedMedia = (mediaId: string) => {
    setSelectedMedia(prev => prev.filter(m => m.id !== mediaId));
  };

  const attachMediaToContent = async (contentId: string) => {
    if (selectedMedia.length === 0) return;

    try {
      const attachmentPromises = selectedMedia.map(media =>
        mediaApi.attachToContent(contentId, media.id, 'inline')
      );
      await Promise.all(attachmentPromises);
      toast({
        title: 'Success',
        description: `Attached ${selectedMedia.length} media file(s) to content`,
      });
    } catch (error) {
      console.error('Failed to attach media:', error);
      // Don't show error toast here - it's not critical
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !slug || !contentType || !user?.id) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Use the actual lexical state from the editor
      const lexicalData = lexicalState || {
        root: {
          type: 'root',
          format: '',
          indent: 0,
          version: 1,
          children: [],
          direction: null,
        },
      };

      const contentData = {
        content_type: contentType,
        title,
        slug,
        author_id: user.id,
        excerpt,
        status,
        body: {
          lexical: lexicalData,
          html: editorContent,
          plainText: plainText || '',
        },
        meta_data: metaData && metaData !== '{}' ? JSON.parse(metaData) : {},
      };

      console.log('Creating content with data:', contentData);

      const createdContent = await contentApi.createContent(contentData);

      // Attach any selected media to the new content
      if (selectedMedia.length > 0) {
        await attachMediaToContent(createdContent.id);
      }

      toast({
        title: 'Success',
        description: 'Content created successfully',
      });

      router.push(`/contents/${createdContent.id}/edit`);
    } catch (err: any) {
      console.error('Create content error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create content');
      toast({
        title: 'Error',
        description: 'Failed to create content',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Media Modal Component
  const MediaModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Media Library</h2>
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                {selectedMedia.length} media selected
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowMediaModal(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {/* Tabs */}
          <div className="w-64 border-r p-4">
            <div className="space-y-2">
              <Button
                variant={activeMediaTab === 'library' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveMediaTab('library')}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Media Library
              </Button>
              <Button
                variant={activeMediaTab === 'upload' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveMediaTab('upload')}
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
                        onClick={() => handleRemoveSelectedMedia(media.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4 overflow-auto">
            {activeMediaTab === 'library' ? (
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
                  {!mediaLibrary || mediaLibrary.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                      <p>No media found in library</p>
                      <p className="text-sm">Switch to upload tab to add media</p>
                    </div>
                  ) : (
                    mediaLibrary.map((media) => {
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
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.parentElement?.querySelector('.image-fallback')?.classList.remove('hidden');
                              }}
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button
                                size="sm"
                                variant={isSelected ? "destructive" : "default"}
                                onClick={() => {
                                  if (isSelected) {
                                    handleRemoveSelectedMedia(media.id);
                                  } else {
                                    handleMediaSelect(media);
                                  }
                                }}
                              >
                                {isSelected ? 'Remove' : 'Select'}
                              </Button>
                            </div>
                          </div>
                          <div className="p-2">
                            <p className="text-sm font-medium truncate">
                              {media.original_filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {media.dimensions?.width} × {media.dimensions?.height}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : (
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
                    <div>
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setUploadFile(file);
                        }}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        Supported formats: JPEG, PNG, GIF, WebP, SVG. Max size: 10MB
                      </p>
                    </div>
                  </div>

                  {uploadFile && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="h-8 w-8 text-blue-500" />
                          <div>
                            <p className="font-medium">{uploadFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUploadFile(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowMediaModal(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => uploadFile && handleFileUpload(uploadFile)}
                    disabled={!uploadFile || isUploading}
                  >
                    {isUploading ? (
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
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Content</h1>
        <p className="text-gray-600 mt-2">
          Create and publish new content with the WYSIWYG editor
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Editor */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Editor</CardTitle>
                <CardDescription>
                  Write your content using the WYSIWYG editor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter content title"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="url-friendly-slug"
                      required
                    />
                  </div>

                  {/* <div className="flex justify-between items-center">
                    <Label>Content</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowMediaModal(true)}
                    >
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Add Media
                      {selectedMedia.length > 0 && (
                        <span className="ml-2 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {selectedMedia.length}
                        </span>
                      )}
                    </Button>
                  </div> */}

                  <div>
                    <Label>Content</Label>
                    <p className="text-sm text-gray-500 mt-1">
                      Use the "Add Media" button in the toolbar above to insert images
                    </p>
                  </div>

                  <LexicalEditor
                    onChange={({ lexical, html, plainText }) => {
                      setEditorContent(html);
                      setLexicalState(lexical);
                      setPlainText(plainText);
                    }}
                    selectedMediaCount={selectedMedia.length} // Pass selected media count
                    onMediaSelect={handleMediaSelect} // Pass media selection handler
                  />
                </div>
              </CardContent>
            </Card>

            {/* Selected Media Preview Card */}
            {selectedMedia.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Selected Media</CardTitle>
                  <CardDescription>
                    Media files that will be attached after content is created
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {!mediaLibrary || mediaLibrary.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-gray-500">
                        <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                        <p>No media found in library</p>
                        <p className="text-sm">Switch to upload tab to add media</p>
                      </div>
                    ) : (
                      mediaLibrary.map((media) => {
                        const isSelected = selectedMedia.some(m => m.id === media.id);

                        // Debug log for each media item
                        console.log('Media item:', {
                          id: media.id,
                          filename: media.original_filename,
                          url: media.url,
                          thumbnail_url: media.thumbnail_url,
                          dimensions: media.dimensions
                        });

                        // Get the image URL with fallback
                        const imageUrl = media.thumbnail_url || media.url;
                        console.log('Image URL:', imageUrl);

                        return (
                          <div
                            key={media.id}
                            className={`border rounded-lg overflow-hidden group ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                          >
                            <div className="aspect-square bg-gray-100 relative">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={media.original_filename}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    console.error('Image failed to load:', imageUrl);
                                    e.currentTarget.src = 'https://via.placeholder.com/300x300?text=Image+Error';
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                                  <ImageIcon className="h-12 w-12 text-gray-400" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                  size="sm"
                                  variant={isSelected ? "destructive" : "default"}
                                  onClick={() => {
                                    if (isSelected) {
                                      handleRemoveSelectedMedia(media.id);
                                    } else {
                                      handleMediaSelect(media);
                                    }
                                  }}
                                >
                                  {isSelected ? 'Remove' : 'Select'}
                                </Button>
                              </div>
                            </div>
                            <div className="p-2">
                              <p className="text-sm font-medium truncate">
                                {media.original_filename}
                              </p>
                              <p className="text-xs text-gray-500">
                                {media.dimensions?.width ? `${media.dimensions.width} × ${media.dimensions.height}` : 'Dimensions not available'}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Publish</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value: ContentStatus) => setStatus(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ContentStatus.DRAFT}>Draft</SelectItem>
                      <SelectItem value={ContentStatus.PENDING_REVIEW}>
                        Pending Review
                      </SelectItem>
                      <SelectItem value={ContentStatus.PUBLISHED}>
                        Published
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contentType">Content Type *</Label>
                  <Select
                    value={contentType}
                    onValueChange={setContentType}
                    disabled={loadingTypes}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select content type" />
                    </SelectTrigger>
                    <SelectContent>
                      {contentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.slug}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Brief description of your content"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaData">Metadata (JSON)</Label>
                  <Textarea
                    id="metaData"
                    value={metaData}
                    onChange={(e) => setMetaData(e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={4}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-3">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="flex space-x-2 w-full">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-2 h-4 w-4" />
                    )}
                    {status === ContentStatus.PUBLISHED ? 'Publish' : 'Save'}
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={() => router.push('/contents')}
                >
                  Cancel
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>

      {/* Media Modal */}
      {showMediaModal && <MediaModal />}
    </div>
  );
}