import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function QuestionCardSkeleton() {
  return (
    <Card className="transition-all duration-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {/* Avatar skeleton */}
            <Skeleton className="h-10 w-10 rounded-full" />
            
            <div className="flex flex-col min-w-0">
              {/* Display name and NIP-05 badge */}
              <div className="flex items-center space-x-2">
                <Skeleton className="h-4 w-24" />
                {/* Random chance for NIP-05 badge */}
                {Math.random() > 0.7 && (
                  <Skeleton className="h-4 w-16 rounded" />
                )}
              </div>
              
              {/* Time skeleton */}
              <div className="flex items-center space-x-1">
                <Skeleton className="h-3 w-3 rounded" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Content skeleton - variable height to simulate real content */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            {/* Random chance for additional lines */}
            {Math.random() > 0.5 && (
              <Skeleton className="h-4 w-3/4" />
            )}
            {Math.random() > 0.7 && (
              <Skeleton className="h-4 w-1/2" />
            )}
          </div>

          {/* Action buttons skeleton */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-20 rounded" />
              <Skeleton className="h-8 w-16 rounded" />
            </div>
            
            {/* Random chance for "Read more" button */}
            {Math.random() > 0.6 && (
              <Skeleton className="h-4 w-16" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
