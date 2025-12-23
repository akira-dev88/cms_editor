// app/(dashboard)/dashboard/page.tsx
'use client';

import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Users,
  Image,
  Settings,
  PlusCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const quickActions = [
    {
      title: 'Create Content',
      description: 'Write a new blog post or article',
      icon: <PlusCircle className="h-8 w-8 text-blue-600" />,
      action: () => router.push('/contents/create'),
    },
    {
      title: 'Manage Contents',
      description: 'View and edit all your contents',
      icon: <FileText className="h-8 w-8 text-green-600" />,
      action: () => router.push('/contents'),
    },
    {
      title: 'Media Library',
      description: 'Upload and manage images & files',
      icon: <Image className="h-8 w-8 text-purple-600" />,
      action: () => router.push('/media'),
    },
    {
      title: 'User Management',
      description: 'Manage users and permissions',
      icon: <Users className="h-8 w-8 text-orange-600" />,
      action: () => router.push('/users'),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome back, {user?.username || user?.email}
          </p>
        </div>
        <Button onClick={handleLogout} variant="outline">
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickActions.map((action, index) => (
          <Card
            key={index}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={action.action}
          >
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4">{action.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{action.title}</h3>
                <p className="text-sm text-gray-500">{action.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="mt-1">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Username</label>
                <p className="mt-1">{user?.username}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Roles</label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {user?.roles?.map((role: string, index: number) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="text-sm">Logged in</div>
                <div className="text-sm text-gray-500">Just now</div>
              </div>
              <div className="text-center py-8 text-gray-500">
                <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Your recent activities will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}