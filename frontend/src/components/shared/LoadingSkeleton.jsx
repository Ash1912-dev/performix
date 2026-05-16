import { Card, CardContent } from'@/components/ui/card';
import { Skeleton } from'@/components/ui/skeleton';

function LoadingSkeleton({ rows = 3, type ='card' }) {
 if (type ==='table') {
 return (
 <Card>
 <CardContent className="space-y-4 p-6">
 <Skeleton className="h-8 w-48" />
 {Array.from({ length: rows }).map((_, index) => (
 <div key={index} className="grid grid-cols-4 gap-3">
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 <Skeleton className="h-10 w-full" />
 </div>
))}
 </CardContent>
 </Card>
);
 }

 if (type ==='list') {
 return (
 <div className="space-y-4">
 {Array.from({ length: rows }).map((_, index) => (
 <Card key={index}>
 <CardContent className="space-y-3 p-6">
 <Skeleton className="h-5 w-44" />
 <Skeleton className="h-4 w-full" />
 <Skeleton className="h-4 w-2/3" />
 </CardContent>
 </Card>
))}
 </div>
);
 }

 return (
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 {Array.from({ length: 4 }).map((_, index) => (
 <Card key={index}>
 <CardContent className="space-y-4 p-6">
 <Skeleton className="h-4 w-24" />
 <Skeleton className="h-9 w-28" />
 <Skeleton className="h-12 w-12 rounded-2xl" />
 </CardContent>
 </Card>
))}
 </div>
);
}

export default LoadingSkeleton;
