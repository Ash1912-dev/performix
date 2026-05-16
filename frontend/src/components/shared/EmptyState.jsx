import { Inbox } from'lucide-react';

import { Button } from'@/components/ui/button';
import { Card, CardContent } from'@/components/ui/card';

function EmptyState({ title, description, actionLabel, onAction }) {
 return (
 <Card className="overflow-hidden">
 <CardContent className="flex flex-col items-center justify-center px-6 py-12 text-center">
 <div className="mb-6 flex size-20 items-center justify-center rounded-[1.75rem] bg-blue-50 text-blue-600">
 <Inbox className="size-10" />
 </div>
 <h3 className="text-gray-700 font-semibold text-lg">{title}</h3>
 <p className="text-gray-500 text-sm mt-3 max-w-md">{description}</p>
 {actionLabel && onAction ? (
 <Button
 type="button"
 className="mt-6 bg-blue-600 text-white hover:bg-blue-700"
 onClick={onAction}
 >
 {actionLabel}
 </Button>
) : null}
 </CardContent>
 </Card>
);
}

export default EmptyState;
