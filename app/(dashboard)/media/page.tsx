'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb } from '@/components/layout/breadcrumb';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
    Image,
    Upload,
    Search,
    X,
    Grid3X3,
    List,
    Trash2,
    Download,
    Copy,
    Check,
    FileImage,
    File,
    Loader2,
    Filter,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { MediaItem } from '@/types/media';
import { format } from 'date-fns';
import { mediaApi } from '@/lib/api/media';

// Format file size helper
const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Get file type from mime type
const getFileType = (mimeType: string): 'image' | 'document' | 'other' => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) return 'document';
    return 'other';
};

// Media type filters with icons and colors
const mediaFilters = [
    { key: 'all', label: 'All', icon: FileImage, color: 'text-gray-600' },
    { key: 'image', label: 'Images', icon: Image, color: 'text-purple-600' },
    { key: 'document', label: 'Documents', icon: File, color: 'text-blue-600' },
];

// Format filters (for images only)
const formatFilters = [
    { key: 'all', label: 'All Formats' },
    { key: 'image/jpeg', label: 'JPEG', extension: 'jpg' },
    { key: 'image/png', label: 'PNG', extension: 'png' },
    { key: 'image/gif', label: 'GIF', extension: 'gif' },
    { key: 'image/webp', label: 'WebP', extension: 'webp' },
    { key: 'image/svg+xml', label: 'SVG', extension: 'svg' },
];

interface UploadProgress {
    filename: string;
    progress: number;
    status: 'uploading' | 'success' | 'error';
}

// Simple loading skeleton component
const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
                <div className="aspect-square w-full bg-gray-200 animate-pulse" />
                <CardContent className="p-3">
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 w-2/3 bg-gray-200 rounded animate-pulse" />
                </CardContent>
            </Card>
        ))}
    </div>
);

export default function MediaPage() {
    const { user, isAuthenticated } = useAuth();
    const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
    const [filteredItems, setFilteredItems] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMediaFilter, setActiveMediaFilter] = useState<'all' | 'image' | 'document'>('all');
    const [activeFormatFilter, setActiveFormatFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<MediaItem | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const itemsPerPage = 12;

    // Fetch media items using the API client
    const fetchMedia = useCallback(async () => {
        if (!isAuthenticated) return;

        setLoading(true);
        try {
            const response = await mediaApi.getAll();
            console.log('Media fetched:', response);

            // Extract the data array from the response
            const mediaData = response.data || response;
            setMediaItems(Array.isArray(mediaData) ? mediaData : []);
        } catch (error) {
            console.error('Error fetching media:', error);
            toast.error('Failed to load media files');
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        fetchMedia();
    }, [fetchMedia]);

    // Apply filters and search
    useEffect(() => {
        let filtered = [...mediaItems];

        // Apply media type filter
        if (activeMediaFilter !== 'all') {
            filtered = filtered.filter(item => getFileType(item.mime_type) === activeMediaFilter);
        }

        // Apply format filter (only for images)
        if (activeFormatFilter !== 'all' && activeMediaFilter !== 'document') {
            filtered = filtered.filter(item => item.mime_type === activeFormatFilter);
        }

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item =>
                item.original_filename.toLowerCase().includes(query) ||
                item.filename.toLowerCase().includes(query)
            );
        }

        // Sort by newest first
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

        setFilteredItems(filtered);
        setTotalPages(Math.ceil(filtered.length / itemsPerPage));
        setCurrentPage(1);
    }, [mediaItems, activeMediaFilter, activeFormatFilter, searchQuery]);

    // Get current page items
    const currentItems = filteredItems.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Upload files
    const handleFileUpload = async (files: FileList | null) => {
        if (!files || !isAuthenticated) return;

        const fileArray = Array.from(files);
        const newUploads: UploadProgress[] = fileArray.map(file => ({
            filename: file.name,
            progress: 0,
            status: 'uploading',
        }));
        setUploadProgress(prev => [...prev, ...newUploads]);
        setUploading(true);

        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];

            try {
                const response = await mediaApi.upload(file);

                // Extract the media item from the response
                const newMedia = response.media || response;
                setMediaItems(prev => [newMedia, ...prev]);

                setUploadProgress(prev =>
                    prev.map(p =>
                        p.filename === file.name ? { ...p, progress: 100, status: 'success' } : p
                    )
                );

                toast.success(`${file.name} uploaded successfully`);
            } catch (error) {
                console.error(`Error uploading ${file.name}:`, error);
                setUploadProgress(prev =>
                    prev.map(p =>
                        p.filename === file.name ? { ...p, status: 'error' } : p
                    )
                );
                toast.error(`Failed to upload ${file.name}`);
            }
        }

        // Clear completed uploads after 3 seconds
        setTimeout(() => {
            setUploadProgress(prev => prev.filter(p => p.status !== 'success'));
            setUploading(false);
        }, 3000);
    };

    // Delete media item
    const handleDelete = async () => {
        if (!itemToDelete) return;

        try {
            await mediaApi.delete(itemToDelete.id);

            setMediaItems(prev => prev.filter(item => item.id !== itemToDelete.id));
            toast.success(`${itemToDelete.original_filename} has been deleted`);
        } catch (error) {
            console.error('Error deleting media:', error);
            toast.error('Failed to delete media file');
        } finally {
            setDeleteDialogOpen(false);
            setItemToDelete(null);
        }
    };

    // Copy URL to clipboard
    const copyToClipboard = async (url: string, id: string) => {
        try {
            await navigator.clipboard.writeText(url);
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
            toast.success('URL copied to clipboard');
        } catch (error) {
            toast.error('Failed to copy URL');
        }
    };

    // Download file
    const downloadFile = async (item: MediaItem) => {
        try {
            const response = await fetch(item.url);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = item.original_filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading file:', error);
            toast.error('Failed to download file');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}

            <div className="min-h-screen bg-gray-50">

                <div className="container mx-auto px-4 py-6">

                    <Breadcrumb />
                    {/* Filters Bar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search by filename..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                                >
                                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            {/* Media Type Filters */}
                            <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
                                {mediaFilters.map((filter) => (
                                    <button
                                        key={filter.key}
                                        onClick={() => setActiveMediaFilter(filter.key as typeof activeMediaFilter)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeMediaFilter === filter.key
                                                ? 'bg-gray-100 text-gray-900'
                                                : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                    >
                                        <filter.icon className={`h-4 w-4 ${filter.color}`} />
                                        {filter.label}
                                    </button>
                                ))}
                            </div>

                            {/* Format Filter - only show when Images are selected */}
                            {activeMediaFilter !== 'document' && (
                                <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
                                    <Filter className="h-4 w-4 text-gray-400 ml-2" />
                                    {formatFilters.map((filter) => (
                                        <button
                                            key={filter.key}
                                            onClick={() => setActiveFormatFilter(filter.key)}
                                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${activeFormatFilter === filter.key
                                                    ? 'bg-gray-100 text-gray-900'
                                                    : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* View Toggle */}
                            <div className="flex items-center gap-1 bg-white rounded-lg border p-1">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'
                                        }`}
                                >
                                    <Grid3X3 className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400'
                                        }`}
                                >
                                    <List className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">
                            {filteredItems.length} {filteredItems.length === 1 ? 'file' : 'files'} found
                        </p>
                        {activeMediaFilter !== 'all' && (
                            <Badge variant="secondary" className="gap-1">
                                {activeMediaFilter === 'image' ? 'Images' : 'Documents'}
                                {activeFormatFilter !== 'all' && ` • ${formatFilters.find(f => f.key === activeFormatFilter)?.label}`}
                                <button onClick={() => { setActiveMediaFilter('all'); setActiveFormatFilter('all'); }} className="ml-1">
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        )}
                    </div>

                    {/* Media Grid / List */}
                    {loading ? (
                        <LoadingSkeleton />
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-16">
                            <Image className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-1">No media files found</h3>
                            <p className="text-gray-500 mb-4">
                                {searchQuery ? 'Try a different search term' : 'Upload your first file to get started'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2">
                                    <Upload className="h-4 w-4" />
                                    Upload Files
                                </Button>
                            )}
                        </div>
                    ) : viewMode === 'grid' ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                {currentItems.map((item) => (
                                    <Card
                                        key={item.id}
                                        className="group overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
                                        onClick={() => setSelectedItem(item)}
                                    >
                                        <div className="relative aspect-square bg-gray-100">
                                            {item.mime_type.startsWith('image/') ? (
                                                <img
                                                    src={item.thumbnail_url || item.url}
                                                    alt={item.original_filename}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        console.error('Image failed to load:', item.url);
                                                        (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <File className="h-12 w-12 text-gray-400" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-8 w-8"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        downloadFile(item);
                                                    }}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-8 w-8"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        copyToClipboard(item.url, item.id);
                                                    }}
                                                >
                                                    {copiedId === item.id ? (
                                                        <Check className="h-4 w-4" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="destructive"
                                                    className="h-8 w-8"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setItemToDelete(item);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardContent className="p-3">
                                            <p className="text-sm font-medium truncate" title={item.original_filename}>
                                                {item.original_filename}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <span className="text-xs text-gray-500">
                                                    {formatFileSize(item.file_size)}
                                                </span>
                                                {item.dimensions && (
                                                    <span className="text-xs text-gray-400">
                                                        {item.dimensions.width}×{item.dimensions.height}
                                                    </span>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex justify-center items-center gap-2 mt-8">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        /* List View */
                        <div className="bg-white rounded-lg border overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            File
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Size
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Uploaded
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 flex-shrink-0">
                                                        {item.mime_type.startsWith('image/') ? (
                                                            <img
                                                                src={item.thumbnail_url || item.url}
                                                                alt={item.original_filename}
                                                                className="h-10 w-10 rounded object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                                }}
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                                                                <File className="h-5 w-5 text-gray-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                                                            {item.original_filename}
                                                        </p>
                                                        {item.dimensions && (
                                                            <p className="text-xs text-gray-400">
                                                                {item.dimensions.width}×{item.dimensions.height}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatFileSize(item.file_size)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="outline" className="text-xs">
                                                    {item.mime_type.split('/')[1]?.toUpperCase() || item.mime_type}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {format(new Date(item.created_at), 'MMM d, yyyy')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            Actions
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => copyToClipboard(item.url, item.id)}>
                                                            <Copy className="h-4 w-4 mr-2" /> Copy URL
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => downloadFile(item)}>
                                                            <Download className="h-4 w-4 mr-2" /> Download
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setItemToDelete(item);
                                                                setDeleteDialogOpen(true);
                                                            }}
                                                            className="text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t flex justify-between items-center">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </Button>
                                    <span className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Preview Dialog */}
                    <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
                        <DialogContent className="max-w-3xl">
                            {selectedItem && (
                                <>
                                    <DialogHeader>
                                        <DialogTitle>{selectedItem.original_filename}</DialogTitle>
                                    </DialogHeader>
                                    <div className="mt-4">
                                        {selectedItem.mime_type.startsWith('image/') ? (
                                            <img
                                                src={selectedItem.url}
                                                alt={selectedItem.original_filename}
                                                className="w-full rounded-lg max-h-[60vh] object-contain"
                                                onError={(e) => {
                                                    console.error('Preview image failed to load:', selectedItem.url);
                                                    (e.target as HTMLImageElement).src = '/placeholder-image.png';
                                                }}
                                            />
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-12">
                                                <File className="h-24 w-24 text-gray-400 mb-4" />
                                                <p className="text-gray-500">Preview not available for this file type</p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                                            <div>
                                                <p className="text-gray-500">Filename</p>
                                                <p className="font-medium">{selectedItem.original_filename}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">File Size</p>
                                                <p className="font-medium">{formatFileSize(selectedItem.file_size)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">MIME Type</p>
                                                <p className="font-medium">{selectedItem.mime_type}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Uploaded</p>
                                                <p className="font-medium">
                                                    {format(new Date(selectedItem.created_at), 'MMM d, yyyy h:mm a')}
                                                </p>
                                            </div>
                                            {selectedItem.dimensions && (
                                                <div>
                                                    <p className="text-gray-500">Dimensions</p>
                                                    <p className="font-medium">
                                                        {selectedItem.dimensions.width} × {selectedItem.dimensions.height} px
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex justify-end gap-2 mt-6">
                                            <Button variant="outline" onClick={() => copyToClipboard(selectedItem.url, selectedItem.id)}>
                                                <Copy className="h-4 w-4 mr-2" />
                                                Copy URL
                                            </Button>
                                            <Button onClick={() => downloadFile(selectedItem)}>
                                                <Download className="h-4 w-4 mr-2" />
                                                Download
                                            </Button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>

                    {/* Delete Confirmation Dialog */}
                    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Delete Media File</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Are you sure you want to delete "{itemToDelete?.original_filename}"?
                                    This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>
        </div>
    );
}