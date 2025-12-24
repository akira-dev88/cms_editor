// app/(dashboard)/contents/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Loader2, Save } from 'lucide-react';
import { ContentStatus } from '@/types/content';
import { useToast } from '@/lib/hooks/use-toast';
import LexicalEditor from '@/components/editor/lexical-editor';

export default function CreateContentPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentTypes, setContentTypes] = useState<any[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [error, setError] = useState('');

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
    </div>
  );
}