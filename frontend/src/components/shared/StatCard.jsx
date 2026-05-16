import { ArrowUpRight } from'lucide-react';

import { Card, CardContent } from'@/components/ui/card';
import { cn } from'@/lib/utils';

const colorMap = {
 blue:'bg-blue-50 text-blue-600',
 green:'bg-emerald-50 text-emerald-600',
 amber:'bg-amber-50 text-amber-600',
 red:'bg-rose-50 text-rose-600',
};

function StatCard({ title, value, icon: Icon, trend, color ='blue' }) {
 return (
 <Card className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
 <CardContent className="p-0">
 <div className="flex items-start justify-between gap-4">
 <div className="space-y-2">
 <p className="text-gray-500 text-sm font-medium">{title}</p>
 <div className="text-gray-900 text-2xl font-bold mt-1">
 {value}
 </div>
 {trend ? (
 <div className="text-green-600 text-sm mt-1 flex items-center gap-1">
 <ArrowUpRight className="size-3.5" />
 {trend}
 </div>
) : null}
 </div>
 <div className={cn('rounded-2xl p-3', colorMap[color] || colorMap.blue)}>
 <Icon className="size-5" />
 </div>
 </div>
 </CardContent>
 </Card>
);
}

export default StatCard;
