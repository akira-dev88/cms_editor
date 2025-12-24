// app/(dashboard)/contents/[id]/edit/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { contentApi } from '@/lib/api/content';
import WysiwygEditor from '@/components/editor/wysiwyg-editor';
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
} from 'lucide-react';
import { ContentStatus } from '@/types/content';
import { useToast } from '@/lib/hooks/use-toast';
import LexicalEditor from '@/components/editor/lexical-editor';

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

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (id && user) {
      loadContent();
    }
  }, [id, user]);

  const loadContent = async () => {
    try {
      setIsLoading(true);
      const contentData = await contentApi.getContent(id);
      setContent(contentData);
      setTitle(contentData.title);
      setSlug(contentData.slug);
      setExcerpt(contentData.excerpt || '');
      setStatus(contentData.status);
      setMetaData(JSON.stringify(contentData.meta_data || {}, null, 2));

      // Get content from body (prefer HTML, then plain text)
      if (contentData.body?.html) {
        setEditorContent(contentData.body.html);
      } else if (contentData.body?.plainText) {
        setEditorContent(contentData.body.plainText);
      } else {
        setEditorContent('');
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

// In your CreateContentPage component, update the handleSubmit function:

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
          {/* Left Column - Editor */}
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

                  <div>
                    <Label>Content</Label>
                    <LexicalEditor
                      onChange={({ lexical, html, plainText }) => {
                        setEditorContent(html);
                        setLexicalState(lexical);
                        setPlainText(plainText);
                      }}
                    />
                  </div>
                </div>
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
                    value={content.content_type?.slug || 'Unknown'}
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
    </div>
  );
}