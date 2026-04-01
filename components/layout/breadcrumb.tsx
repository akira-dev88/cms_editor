// components/layout/breadcrumb.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent?: boolean;
}

// Map routes to display names
const routeNames: Record<string, string> = {
  'dashboard': 'Dashboard',
  'contents': 'Contents',
  'media': 'Media Library',
  'edit': 'Edit',
  '[id]': 'Details',
};

export function Breadcrumb() {
  const pathname = usePathname();
  
  // Skip breadcrumbs on dashboard
  if (pathname === '/dashboard') {
    return null;
  }
  
  // Generate breadcrumb items from pathname
  const paths = pathname.split('/').filter(path => path && path !== 'dashboard');
  
  const breadcrumbItems: BreadcrumbItem[] = [
    { label: 'Home', href: '/dashboard' }
  ];
  
  let currentPath = '/dashboard';
  
  paths.forEach((path, index) => {
    currentPath += `/${path}`;
    const isLast = index === paths.length - 1;
    
    // Clean up the label (remove IDs and format)
    let label = routeNames[path] || path;
    
    // Handle dynamic IDs (like content IDs)
    if (path.match(/^[0-9a-fA-F-]{36}$/)) {
      label = 'Content Details';
    } else if (path.match(/^\d+$/)) {
      label = 'Item Details';
    }
    
    // Capitalize first letter
    label = label.charAt(0).toUpperCase() + label.slice(1);
    
    breadcrumbItems.push({
      label,
      href: currentPath,
      isCurrent: isLast,
    });
  });
  
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6" aria-label="Breadcrumb">
      <Link
        href="/dashboard"
        className="flex items-center hover:text-gray-700 transition-colors"
      >
        <Home className="h-4 w-4" />
      </Link>
      {breadcrumbItems.slice(1).map((item, index) => (
        <Fragment key={item.href}>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          {item.isCurrent ? (
            <span className="text-gray-900 font-medium" aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="hover:text-gray-700 transition-colors"
            >
              {item.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  );
}