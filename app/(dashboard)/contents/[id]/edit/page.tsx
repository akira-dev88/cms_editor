// app/(dashboard)/contents/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import {
  Loader2,
  Save,
  Trash2,
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  X,
  Search,
} from 'lucide-react';
import { ContentStatus } from '@/types/content';
import { useToast } from '@/lib/hooks/use-toast';
import LexicalEditor from '@/components/editor/lexical-editor';

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

interface ContentMedia {
  id: string;
  media: MediaItem;
  role: string;
  sort_order: number;
  assigned_at: string;
}

export default function EditContentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  // Media states
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>([]);
  const [contentMedia, setContentMedia] = useState<ContentMedia[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMediaTab, setActiveMediaTab] = useState<'library' | 'upload'>('library');

  // Existing states
  const [content, setContent] = useState<any>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [status, setStatus] = useState<ContentStatus>(ContentStatus.DRAFT);
  const [metaData, setMetaData] = useState('{}');
  const [contentType, setContentType] = useState('');

  const [editorContent, setEditorContent] = useState('');
  const [lexicalState, setLexicalState] = useState<any>(null);
  const [plainText, setPlainText] = useState('');

  // Load content media
  const loadContentMedia = async () => {
    try {
      const media = await mediaApi.getContentMedia(id);
      setContentMedia(media);
    } catch (error) {
      console.error('Failed to load content media:', error);
    }
  };

  // Load media library
  const loadMediaLibrary = async () => {
    try {
      const response = await mediaApi.getAll({ search: searchQuery });
      setMediaLibrary(response.data);
    } catch (error) {
      console.error('Failed to load media library:', error);
      toast({
        title: 'Error',
        description: 'Failed to load media library',
      });
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (id && user) {
      loadContent();
      loadContentMedia();
    }
  }, [id, user]);

  useEffect(() => {
    if (showMediaModal && activeMediaTab === 'library') {
      loadMediaLibrary();
    }
  }, [showMediaModal, activeMediaTab, searchQuery]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      const contentData = await contentApi.getContent(id);
      setContent(contentData);
      setTitle(contentData.title);
      setSlug(contentData.slug);
      setExcerpt(contentData.excerpt || '');
      setStatus(contentData.status);
      setContentType(contentData.content_type?.slug || '');
      setMetaData(JSON.stringify(contentData.meta_data || {}, null, 2));

      // Get content from body
      if (contentData.body?.html) {
        setEditorContent(contentData.body.html);
      } else if (contentData.body?.plainText) {
        setEditorContent(contentData.body.plainText);
      } else {
        setEditorContent('');
      }

      if (contentData.body?.lexical) {
        setLexicalState(contentData.body.lexical);
      }

    } catch (error) {
      console.error('Failed to load content:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content',
      });
      router.push('/contents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!title || !slug || !user?.id) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const contentData = {
        content_type: contentType,
        title,
        slug,
        excerpt,
        status,
        body: {
          lexical: lexicalState,
          html: editorContent,
          plainText: plainText || '',
        },
        meta_data: metaData && metaData !== '{}' ? JSON.parse(metaData) : {},
      };

      await contentApi.updateContent(id, contentData);

      toast({
        title: 'Success',
        description: 'Content updated successfully',
      });
    } catch (err: any) {
      console.error('Update content error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update content');
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
      console.error('Delete content error:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete content',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Media functions
  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const response = await mediaApi.upload(file);
      // Attach to content
      await mediaApi.attachToContent(id, response.media.id, 'inline');
      // Refresh media lists
      await loadContentMedia();
      await loadMediaLibrary();
      toast({
        title: 'Success',
        description: 'Media uploaded and attached',
      });
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

  const handleAttachMedia = async (mediaId: string) => {
    try {
      await mediaApi.attachToContent(id, mediaId, 'inline');
      await loadContentMedia();
      toast({
        title: 'Success',
        description: 'Media attached to content',
      });
    } catch (error) {
      console.error('Failed to attach media:', error);
      toast({
        title: 'Error',
        description: 'Failed to attach media',
      });
    }
  };

  const handleDetachMedia = async (mediaId: string) => {
    try {
      await mediaApi.detachFromContent(id, mediaId);
      setContentMedia(prev => prev.filter(m => m.media.id !== mediaId));
      toast({
        title: 'Success',
        description: 'Media detached from content',
      });
    } catch (error) {
      console.error('Failed to detach media:', error);
      toast({
        title: 'Error',
        description: 'Failed to detach media',
      });
    }
  };

  const handleDeleteMedia = async (mediaId: string) => {
    if (!confirm('Are you sure you want to delete this media file? This action cannot be undone.')) {
      return;
    }

    try {
      await mediaApi.delete(mediaId);
      // Update both lists
      setMediaLibrary(prev => prev.filter(m => m.id !== mediaId));
      setContentMedia(prev => prev.filter(m => m.media.id !== mediaId));
      toast({
        title: 'Success',
        description: 'Media deleted',
      });
    } catch (error) {
      console.error('Failed to delete media:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete media',
      });
    }
  };

  // Media Modal Component
  const MediaModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Media Library</h2>
            <Button variant="ghost" size="sm" onClick={() => setShowMediaModal(false)}>
              <X className="h-4 w-4" />
            </Button>
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
                  {mediaLibrary.map((media) => (
                    <div key={media.id} className="border rounded-lg overflow-hidden group">
                      <div className="aspect-square bg-gray-100 relative">
                        <img
                          src={media.thumbnail_url || media.url}
                          alt={media.original_filename}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAttachMedia(media.id)}
                          >
                            Attach
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteMedia(media.id)}
                          >
                            Delete
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
                  ))}
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
                    </Button>
                  </div>

                  <LexicalEditor
                    onChange={({ lexical, html, plainText }) => {
                      setEditorContent(html);
                      setLexicalState(lexical);
                      setPlainText(plainText);
                    }}
                     contentId={id}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attached Media Card */}
            <Card>
              <CardHeader>
                <CardTitle>Attached Media</CardTitle>
                <CardDescription>
                  Media files attached to this content
                </CardDescription>
              </CardHeader>
              <CardContent>
                {contentMedia.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4" />
                    <p>No media attached to this content</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setShowMediaModal(true)}
                    >
                      Add Media
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {contentMedia.map((item) => (
                      <div key={item.id} className="border rounded-lg overflow-hidden group">
                        <div className="aspect-square bg-gray-100 relative">
                          <img
                            src={item.media.thumbnail_url || item.media.url}
                            alt={item.media.original_filename}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDetachMedia(item.media.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Detach
                            </Button>
                          </div>
                        </div>
                        <div className="p-2">
                          <p className="text-sm font-medium truncate">
                            {item.media.original_filename}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.media.dimensions?.width} × {item.media.dimensions?.height}
                          </p>
                          <p className="text-xs text-gray-500">
                            Role: {item.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder="Brief description of your content"
                    rows={4}
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
                    {status === ContentStatus.PUBLISHED ? 'Update' : 'Save'}
                  </Button>
                </div>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{content.views_count || 0}</div>
                    <div className="text-sm text-gray-500">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{content.likes_count || 0}</div>
                    <div className="text-sm text-gray-500">Likes</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{content.comments_count || 0}</div>
                    <div className="text-sm text-gray-500">Comments</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{content.version || 1}</div>
                    <div className="text-sm text-gray-500">Version</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {/* Media Modal */}
      {showMediaModal && <MediaModal />}
    </div>
  );
}