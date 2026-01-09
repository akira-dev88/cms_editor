'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { contentApi } from '@/lib/api/content';
import { mediaApi } from '@/lib/api/media';
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
import {
  Loader2,
  Save,
  Trash2,
  ArrowLeft,
  Image as ImageIcon,
} from 'lucide-react';
import { ContentStatus } from '@/types/content';
import { useToast } from '@/lib/hooks/use-toast';
import LexicalEditor from '@/components/editor/lexical-editor';
import MediaModal from './components/MediaModal';
import ContentStats from './components/ContentStats';
import type { MediaItem } from '@/types/media';
import { transformMediaItem } from '@/lib/utils/media';

// ========== Types ==========
interface ContentFormData {
  title: string;
  slug: string;
  excerpt: string;
  status: ContentStatus;
  metaData: string;
  contentType: string;
  editorContent: string;
  lexicalState: any;
  plainText: string;
}

// ========== Custom Hooks ==========
const useContentLoader = (id: string) => {
  const [content, setContent] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const loadContent = useCallback(async () => {
    try {
      setIsLoading(true);
      const contentData = await contentApi.getContent(id);
      setContent(contentData);
      return contentData;
    } catch (error) {
      console.error('❌ Failed to load content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content',
      });
      router.push('/contents');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [id, router, toast]);

  return { content, isLoading, loadContent };
};

const useMediaManager = (contentId: string) => {
  const [contentMedia, setContentMedia] = useState<MediaItem[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const { toast } = useToast();

  const loadContentMedia = useCallback(async () => {
    try {
      const response = await mediaApi.getContentMedia(contentId);
      const mediaItems: MediaItem[] = [];

      if (Array.isArray(response)) {
        for (const item of response) {
          if (item.media) {
            const transformed = transformMediaItem(item.media);
            if (transformed) {
              mediaItems.push(transformed);
            }
          }
        }
      }

      setContentMedia(mediaItems);
    } catch (error) {
      console.error('❌ Failed to load content media:', error);
    }
  }, [contentId]);

  const attachMediaToContent = useCallback(async (mediaItems: MediaItem[]) => {
    if (mediaItems.length === 0) return;

    try {
      const currentMediaIds = contentMedia.map(m => m.id);
      const mediaToAttach = mediaItems.filter(m => !currentMediaIds.includes(m.id));

      if (mediaToAttach.length === 0) return;

      const attachmentPromises = mediaToAttach.map(media =>
        mediaApi.attachToContent(contentId, media.id, 'inline')
      );
      await Promise.all(attachmentPromises);
      toast({
        title: 'Success',
        description: `Attached ${mediaToAttach.length} media file(s) to content`,
      });
      await loadContentMedia();
    } catch (error) {
      console.error('❌ Failed to attach media:', error);
    }
  }, [contentId, contentMedia, loadContentMedia, toast]);

  const handleMediaSelect = useCallback((media: MediaItem) => {
    const isSelected = selectedMedia.some(m => m.id === media.id);

    if (isSelected) {
      setSelectedMedia(prev => prev.filter(m => m.id !== media.id));
      toast({
        title: 'Media removed',
        description: 'Media will not be attached',
      });
    } else {
      setSelectedMedia(prev => [...prev, media]);
      toast({
        title: 'Media selected',
        description: 'Media will be attached after save',
      });
    }
  }, [selectedMedia, toast]);

  const handleDetachMedia = useCallback(async (mediaId: string) => {
    try {
      await mediaApi.detachFromContent(contentId, mediaId);
      setContentMedia(prev => prev.filter(m => m.id !== mediaId));
      setSelectedMedia(prev => prev.filter(m => m.id !== mediaId));
      toast({
        title: 'Success',
        description: 'Media detached from content',
      });
    } catch (error) {
      console.error('❌ Failed to detach media:', error);
      toast({
        title: 'Error',
        description: 'Failed to detach media',
      });
    }
  }, [contentId, toast]);

  return {
    contentMedia,
    selectedMedia,
    setSelectedMedia,
    loadContentMedia,
    attachMediaToContent,
    handleMediaSelect,
    handleDetachMedia,
  };
};

// ========== Helper Functions ==========
const initializeFormData = (contentData: any): ContentFormData => ({
  title: contentData.title || '',
  slug: contentData.slug || '',
  excerpt: contentData.excerpt || '',
  status: contentData.status || ContentStatus.DRAFT,
  metaData: JSON.stringify(contentData.meta_data || {}, null, 2),
  contentType: contentData.content_type?.slug || '',
  editorContent: contentData.body?.html || contentData.body?.plainText || '',
  lexicalState: contentData.body?.lexical || null,
  plainText: contentData.body?.plainText || '',
});


const prepareUpdateData = (
  formData: ContentFormData,
  userId: string,
  contentData: any // Add this parameter to get the original content
): any => ({
  title: formData.title,
  slug: formData.slug,
  excerpt: formData.excerpt,
  status: formData.status,
  body: {
    lexical: formData.lexicalState || {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [],
        direction: null,
      },
    },
    html: formData.editorContent,
    plainText: formData.plainText || '',
  },
  meta_data: formData.metaData && formData.metaData !== '{}'
    ? JSON.parse(formData.metaData)
    : {},
  // Use the content_type_id from the original content data
  content_type_id: contentData.content_type?.id || contentData.content_type_id,
  // Also include author_id if required
  author_id: userId,
});

// ========== Main Component ==========
export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  // State
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    slug: '',
    excerpt: '',
    status: ContentStatus.DRAFT,
    metaData: '{}',
    contentType: '',
    editorContent: '',
    lexicalState: null,
    plainText: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showMediaModal, setShowMediaModal] = useState(false);

  // Hooks
  const { content, isLoading, loadContent } = useContentLoader(id);
  const {
    contentMedia,
    selectedMedia,
    setSelectedMedia,
    loadContentMedia,
    attachMediaToContent,
    handleMediaSelect,
    handleDetachMedia,
  } = useMediaManager(id);

  // Effects
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (id && user) {
      loadContentAndMedia();
    }
  }, [id, user]);

  const loadContentAndMedia = async () => {
    const loadedContent = await loadContent();
    if (loadedContent) {
      setFormData(initializeFormData(loadedContent));
      await loadContentMedia();
    }
  };

  // Event Handlers
  const handleFormChange = (field: keyof ContentFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.slug || !user?.id || !content) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData = prepareUpdateData(formData, user.id, content);
      console.log('📝 Updating content with data:', updateData);

      await contentApi.updateContent(id, updateData);

      // Attach any selected media
      if (selectedMedia.length > 0) {
        await attachMediaToContent(selectedMedia);
        setSelectedMedia([]);
      }

      toast({
        title: 'Success',
        description: 'Content updated successfully',
      });

      // Refresh the content after update
      await loadContentAndMedia();

    } catch (err: any) {
      console.error('❌ Update content error:', err);

      // More detailed error message
      if (err.response?.status === 500) {
        setError('Server error: Failed to update content. Please check the content type.');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to update content');
      }

      toast({
        title: 'Error',
        description: 'Failed to update content',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await contentApi.deleteContent(id);
      toast({
        title: 'Deleted',
        description: 'Content deleted successfully',
      });
      router.push('/contents');
    } catch (err: any) {
      console.error('❌ Delete content error:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete content',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Loading States
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!content) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.push('/contents')}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contents
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Content</h1>
          <p className="text-gray-600 mt-2">
            Last updated: {new Date(content.updated_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Editor & Media */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Content Editor</CardTitle>
                <CardDescription>
                  Edit your content using the WYSIWYG editor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleFormChange('title', e.target.value)}
                      placeholder="Enter content title"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => handleFormChange('slug', e.target.value)}
                      placeholder="url-friendly-slug"
                      required
                    />
                  </div>

                  <div className="flex justify-between items-center">
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
                  </div>

                  <LexicalEditor
                    onChange={({ lexical, html, plainText }) => {
                      handleFormChange('lexicalState', lexical);
                      handleFormChange('editorContent', html);
                      handleFormChange('plainText', plainText);
                    }}
                    contentId={id}
                    initialValue={content?.body?.lexical}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attached Media Section */}
            {contentMedia.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Attached Media</CardTitle>
                  <CardDescription>
                    Media files attached to this content
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {contentMedia.map((media) => (
                      <div key={media.id} className="border rounded-lg overflow-hidden group">
                        <div className="aspect-square bg-gray-100 relative">
                          <img
                            src={media.thumbnail_url || media.url}
                            alt={media.original_filename}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDetachMedia(media.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Detach
                            </Button>
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-sm font-medium truncate">
                            {media.original_filename}
                          </p>
                        </div>
                      </div>
                    ))}
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
                    value={formData.status}
                    onValueChange={(value: ContentStatus) => handleFormChange('status', value)}
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
                      <SelectItem value={ContentStatus.ARCHIVED}>
                        Archived
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Content Type</Label>
                  <Input
                    value={content.content_type?.name || 'Unknown'}
                    disabled
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => handleFormChange('excerpt', e.target.value)}
                    placeholder="Brief description of your content"
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="metaData">Metadata (JSON)</Label>
                  <Textarea
                    id="metaData"
                    value={formData.metaData}
                    onChange={(e) => handleFormChange('metaData', e.target.value)}
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
                    {formData.status === ContentStatus.PUBLISHED ? 'Update' : 'Save'}
                  </Button>
                </div>
              </CardFooter>
            </Card>

            {/* Statistics */}
            <ContentStats content={content} />
          </div>
        </div>
      </form>

      {/* Media Modal */}
      {showMediaModal && (
        <MediaModal
          isOpen={showMediaModal}
          onClose={() => setShowMediaModal(false)}
          contentId={id}
          selectedMedia={selectedMedia}
          onMediaSelect={handleMediaSelect}
          onSelectedMediaChange={setSelectedMedia}
        />
      )}
    </div>
  );
}