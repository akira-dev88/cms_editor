'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Upload,
    Search,
    Trash2,
    Image as ImageIcon,
    File,
    Video,
    Copy,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    Download,
    Maximize2,
} from 'lucide-react';
import { mediaApi, MediaItem } from '@/lib/api/media';
import { useAuth } from '@/lib/auth-context';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/components/ui/use-toast';

// Lightbox Component - Moved inside the same file but properly structured
const Lightbox = ({ 
    items, 
    currentIndex, 
    isOpen, 
    onClose, 
    onNext, 
    onPrev 
}: { 
    items: MediaItem[];
    currentIndex: number;
    isOpen: boolean;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}) => {
    const [currentItem, setCurrentItem] = useState<MediaItem | null>(null);
    const [isImage, setIsImage] = useState(false);
    const [isVideo, setIsVideo] = useState(false);

    useEffect(() => {
        if (items[currentIndex]) {
            const item = items[currentIndex];
            setCurrentItem(item);
            setIsImage(item.mime_type.startsWith('image/'));
            setIsVideo(item.mime_type.startsWith('video/'));
        }
    }, [items, currentIndex]);

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowLeft') onPrev();
        };
        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [onClose, onNext, onPrev]);

    // Handle download
    const handleDownload = () => {
        if (!currentItem) return;
        const link = document.createElement('a');
        link.href = currentItem.url;
        link.download = currentItem.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!isOpen || !currentItem) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-50 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
                <X className="h-6 w-6" />
            </button>

            {/* Navigation buttons */}
            {items.length > 1 && (
                <>
                    <button
                        onClick={onPrev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                        onClick={onNext}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
                        disabled={currentIndex === items.length - 1}
                    >
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </>
            )}

            {/* Counter */}
            <div className="absolute top-4 left-4 z-50 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
                {currentIndex + 1} / {items.length}
            </div>

            {/* Action buttons */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
                <Button
                    onClick={handleDownload}
                    variant="secondary"
                    size="sm"
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                </Button>
                <Button
                    onClick={() => window.open(currentItem.url, '_blank')}
                    variant="secondary"
                    size="sm"
                    className="bg-black/50 hover:bg-black/70 text-white border-0"
                >
                    <Maximize2 className="h-4 w-4 mr-2" />
                    Open in New Tab
                </Button>
            </div>

            {/* Media content */}
            <div className="relative w-full h-full flex items-center justify-center p-4">
                {isImage ? (
                    <img
                        src={currentItem.url}
                        alt={currentItem.filename}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                            console.error('❌ Lightbox image failed to load:', currentItem.url);
                            const target = e.target as HTMLImageElement;
                            target.src = `https://placehold.co/800x600/cccccc/666666?text=Image+Failed+to+Load`;
                        }}
                    />
                ) : isVideo ? (
                    <div className="w-full max-w-4xl">
                        <video
                            src={currentItem.url}
                            controls
                            autoPlay
                            className="w-full h-auto max-h-[80vh]"
                        >
                            Your browser does not support the video tag.
                        </video>
                    </div>
                ) : (
                    <div className="text-center text-white">
                        <File className="h-24 w-24 mx-auto mb-4 text-gray-400" />
                        <h3 className="text-xl font-semibold mb-2">Preview not available</h3>
                        <p className="text-gray-300">{currentItem.filename}</p>
                        <Button
                            onClick={handleDownload}
                            className="mt-4"
                        >
                            <Download className="h-4 w-4 mr-2" />
                            Download File
                        </Button>
                    </div>
                )}
            </div>

            {/* File info panel */}
            <div className="absolute bottom-4 right-4 z-50 max-w-md bg-black/70 text-white p-4 rounded-lg backdrop-blur-sm">
                <h4 className="font-semibold mb-2">File Information</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-300">Filename:</div>
                    <div className="font-medium truncate">{currentItem.filename}</div>
                    
                    <div className="text-gray-300">Original:</div>
                    <div className="font-medium truncate">{currentItem.original_filename}</div>
                    
                    <div className="text-gray-300">Size:</div>
                    <div className="font-medium">{formatFileSize(currentItem.file_size)}</div>
                    
                    <div className="text-gray-300">Type:</div>
                    <div className="font-medium">{currentItem.mime_type}</div>
                    
                    <div className="text-gray-300">Dimensions:</div>
                    <div className="font-medium">
                        {currentItem.dimensions?.width && currentItem.dimensions?.height
                            ? `${currentItem.dimensions.width} × ${currentItem.dimensions.height}`
                            : 'N/A'}
                    </div>
                    
                    <div className="text-gray-300">Uploaded:</div>
                    <div className="font-medium">{formatDate(currentItem.created_at)}</div>
                </div>
            </div>

            {/* Background click to close */}
            <div 
                className="absolute inset-0 -z-10 cursor-pointer"
                onClick={onClose}
            />
        </div>
    );
};

// Format file size helper function
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Format date helper function
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

export default function MediaPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    
    // Lightbox state
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    // Fetch media items
    const fetchMedia = useCallback(async () => {
        try {
            setLoading(true);
            const response = await mediaApi.getAll({
                page,
                limit,
                search: searchTerm || undefined,
            });

            console.log('📦 Media API response:', response);

            // Check if response has data property
            const items = response.data || [];

            // Ensure each item has proper URL and thumbnail_url
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

            const processedItems = items.map((item: any) => {
                // Build main URL
                let url = item.url;
                if (!url && item.file_path) {
                    url = `${baseUrl}${item.file_path}`;
                }

                // Build thumbnail URL
                let thumbnailUrl = item.thumbnail_url;
                if (!thumbnailUrl) {
                    if (item.thumbnail_paths?.small) {
                        thumbnailUrl = `${baseUrl}${item.thumbnail_paths.small}`;
                    } else if (item.thumbnail_paths?.medium) {
                        thumbnailUrl = `${baseUrl}${item.thumbnail_paths.medium}`;
                    } else if (item.thumbnail_paths?.large) {
                        thumbnailUrl = `${baseUrl}${item.thumbnail_paths.large}`;
                    } else {
                        thumbnailUrl = url;
                    }
                } else if (thumbnailUrl.startsWith('/')) {
                    thumbnailUrl = `${baseUrl}${thumbnailUrl}`;
                }

                return {
                    ...item,
                    url,
                    thumbnail_url: thumbnailUrl,
                };
            });

            setMediaItems(processedItems);
            setTotalItems(response.total || processedItems.length);
        } catch (error) {
            console.error('Error fetching media:', error);
            toast({
                title: 'Error',
                description: 'Failed to load media items',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    }, [page, limit, searchTerm]);

    // Initial fetch
    useEffect(() => {
        if (user) {
            fetchMedia();
        }
    }, [user, fetchMedia]);

    // Handle file upload
    const handleFileUpload = async () => {
        if (!selectedFile) {
            toast({
                title: 'No file selected',
                description: 'Please select a file to upload',
                variant: 'destructive',
            });
            return;
        }

        try {
            setUploading(true);
            const response = await mediaApi.upload(selectedFile);

            toast({
                title: 'Success',
                description: response.message || 'File uploaded successfully',
            });

            fetchMedia();
            setSelectedFile(null);

            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) {
                fileInput.value = '';
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            toast({
                title: 'Upload failed',
                description: error.response?.data?.message || 'Failed to upload file',
                variant: 'destructive',
            });
        } finally {
            setUploading(false);
        }
    };

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 10 * 1024 * 1024) {
                toast({
                    title: 'File too large',
                    description: 'Maximum file size is 10MB',
                    variant: 'destructive',
                });
                return;
            }
            setSelectedFile(file);
        }
    };

    // Handle delete confirmation
    const handleDeleteClick = (item: MediaItem) => {
        setSelectedMedia(item);
        setDeleteDialogOpen(true);
    };

    // Handle delete confirmation
    const handleDeleteConfirm = async () => {
        if (!selectedMedia) return;

        try {
            await mediaApi.delete(selectedMedia.id);

            toast({
                title: 'Success',
                description: 'Media item deleted successfully',
            });

            fetchMedia();
        } catch (error) {
            console.error('Delete error:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete media item',
                variant: 'destructive',
            });
        } finally {
            setDeleteDialogOpen(false);
            setSelectedMedia(null);
        }
    };

    // Copy URL to clipboard
    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            toast({
                title: 'Copied!',
                description: 'URL copied to clipboard',
            });
        });
    };

    // Get file icon based on mime type
    const getFileIcon = (mimeType: string) => {
        if (mimeType.startsWith('image/')) {
            return <ImageIcon className="h-8 w-8 text-blue-500" />;
        } else if (mimeType.startsWith('video/')) {
            return <Video className="h-8 w-8 text-red-500" />;
        } else {
            return <File className="h-8 w-8 text-gray-500" />;
        }
    };

    // Open lightbox for specific item
    const openLightbox = (index: number) => {
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    // Navigate lightbox
    const nextLightbox = () => {
        if (lightboxIndex < filteredItems.length - 1) {
            setLightboxIndex(prev => prev + 1);
        }
    };

    const prevLightbox = () => {
        if (lightboxIndex > 0) {
            setLightboxIndex(prev => prev - 1);
        }
    };

    // Filter media items based on search
    const filteredItems = mediaItems.filter(item =>
        item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.original_filename.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
                    <p className="text-gray-600 mt-2">
                        Upload and manage your media files
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">
                        {totalItems} {totalItems === 1 ? 'item' : 'items'}
                    </span>
                </div>
            </div>

            {/* Upload Section */}
            <Card className="mb-8">
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <div className="flex-1">
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-4 text-gray-500" />
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-gray-500">PNG, JPG, GIF, MP4, PDF up to 10MB</p>
                                </div>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    accept="image/*,video/*,application/pdf"
                                />
                            </label>
                        </div>
                        <div className="flex flex-col gap-2">
                            {selectedFile && (
                                <div className="text-sm text-gray-600">
                                    Selected: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                                </div>
                            )}
                            <Button
                                onClick={handleFileUpload}
                                disabled={!selectedFile || uploading}
                                className="w-full md:w-auto"
                            >
                                {uploading ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-2" />
                                        Upload File
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Search and Controls */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                        type="search"
                        placeholder="Search media..."
                        className="pl-10 w-full md:w-80"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Media Items */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                </div>
            ) : filteredItems.length === 0 ? (
                <Card>
                    <CardContent className="py-12">
                        <div className="text-center">
                            <ImageIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No media found</h3>
                            <p className="text-gray-500">
                                {searchTerm ? 'Try a different search term' : 'Upload your first file'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                // List View with Click-to-View
                <div className="space-y-2">
                    {filteredItems.map((item, index) => (
                        <Card 
                            key={item.id} 
                            className="group hover:bg-gray-50 cursor-pointer transition-colors"
                            onClick={() => openLightbox(index)}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="shrink-0 relative"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {item.mime_type.startsWith('image/') ? (
                                            <div className="relative w-16 h-16">
                                                <img
                                                    src={item.thumbnail_url || item.url}
                                                    alt={item.filename}
                                                    className="w-16 h-16 object-cover rounded hover:opacity-90 transition-opacity"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.src = `https://placehold.co/64x64/cccccc/666666?text=${item.mime_type.split('/')[1]}`;
                                                    }}
                                                />
                                                {/* Overlay for thumbnail */}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded transition-colors flex items-center justify-center">
                                                    <Eye className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-16 h-16 flex items-center justify-center bg-gray-100 rounded">
                                                {getFileIcon(item.mime_type)}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-gray-900 truncate hover:text-blue-600 transition-colors">
                                                {item.filename}
                                            </h3>
                                            <span className="text-xs text-gray-500">
                                                ({item.original_filename})
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {formatFileSize(item.file_size)} • {item.mime_type} •{' '}
                                            {formatDate(item.created_at)}
                                        </div>
                                        <div className="text-xs text-gray-400 mt-1 truncate">
                                            {item.url}
                                        </div>
                                    </div>
                                    <div 
                                        className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.open(item.url, '_blank')}
                                        >
                                            <Maximize2 className="h-4 w-4 mr-1" />
                                            Open
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                copyToClipboard(item.url);
                                            }}
                                        >
                                            <Copy className="h-4 w-4 mr-1" />
                                            Copy URL
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteClick(item);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalItems > limit && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-gray-600">
                        Page {page} of {Math.ceil(totalItems / limit)}
                    </span>
                    <Button
                        variant="outline"
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= Math.ceil(totalItems / limit)}
                    >
                        Next
                    </Button>
                </div>
            )}

            {/* Lightbox */}
            <Lightbox
                items={filteredItems}
                currentIndex={lightboxIndex}
                isOpen={lightboxOpen}
                onClose={() => setLightboxOpen(false)}
                onNext={nextLightbox}
                onPrev={prevLightbox}
            />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Media</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete "{selectedMedia?.filename}"?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}