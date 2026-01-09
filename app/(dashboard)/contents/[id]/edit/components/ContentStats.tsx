import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ContentStatsProps {
  content: any;
}

export default function ContentStats({ content }: ContentStatsProps) {
  return (
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
  );
}